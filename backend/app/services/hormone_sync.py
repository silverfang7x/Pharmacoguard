"""Hormone-Sync service – correlates menstrual cycle phases with drug side-effects.

Uses Pandas for data-frame joining and Pearson correlation, Groq for
personalised warning text generation.
"""

from __future__ import annotations

import json
import uuid
from datetime import date, timedelta

import pandas as pd
from groq import AsyncGroq
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.adverse_event import AdverseEvent
from app.models.hormone_cycle_log import HormoneCycleLog
from app.models.medication import Medication
from app.schemas.hormone import (
    CorrelatedPattern,
    CorrelationResult,
    CycleDrugWarning,
    CyclePhase,
    ForecastDay,
    ForecastResponse,
)

MODEL = "llama-3.3-70b-versatile"

# Numeric encoding for phases (biological order)
PHASE_ORDER = {
    "menstrual": 1,
    "follicular": 2,
    "ovulatory": 3,
    "luteal": 4,
}

# Severity text → numeric weight
SEVERITY_WEIGHT = {
    "mild": 1,
    "moderate": 2,
    "severe": 3,
    "critical": 4,
}

# Known drug-phase sensitivity heuristics (fallback when not enough data)
PHASE_SENSITIVITY: dict[str, dict[str, float]] = {
    "menstrual":  {"nsaid_risk": 0.7, "hormonal_risk": 0.8, "anticoagulant_risk": 0.9},
    "follicular": {"nsaid_risk": 0.3, "hormonal_risk": 0.4, "anticoagulant_risk": 0.4},
    "ovulatory":  {"nsaid_risk": 0.4, "hormonal_risk": 0.6, "anticoagulant_risk": 0.5},
    "luteal":     {"nsaid_risk": 0.6, "hormonal_risk": 0.7, "anticoagulant_risk": 0.6},
}

# Typical cycle length for forecasting when history is insufficient
DEFAULT_CYCLE_LENGTH = 28

# Phase day-ranges within a default 28-day cycle
PHASE_RANGES: list[tuple[int, int, CyclePhase]] = [
    (1, 5, CyclePhase.MENSTRUAL),
    (6, 13, CyclePhase.FOLLICULAR),
    (14, 16, CyclePhase.OVULATORY),
    (17, 28, CyclePhase.LUTEAL),
]


def _phase_for_day(cycle_day: int) -> CyclePhase:
    """Map a 1-based cycle day to its phase."""
    d = ((cycle_day - 1) % DEFAULT_CYCLE_LENGTH) + 1
    for lo, hi, phase in PHASE_RANGES:
        if lo <= d <= hi:
            return phase
    return CyclePhase.LUTEAL


class HormoneSyncService:
    """Stateless service — instantiate per-request with a DB session."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # ──────────────────────────────────────────────
    # 1.  Correlation engine
    # ──────────────────────────────────────────────

    async def correlate_cycle_drug_effects(
        self, user_id: uuid.UUID, drug_name: str
    ) -> CorrelationResult:
        """Join cycle_logs + adverse_events, compute Pearson r, return top 3 patterns."""

        # Fetch cycle logs
        cycle_rows = (
            await self._db.execute(
                select(HormoneCycleLog).where(HormoneCycleLog.user_id == user_id)
            )
        ).scalars().all()

        # Resolve medication id(s) for the drug
        med_rows = (
            await self._db.execute(
                select(Medication).where(Medication.name.ilike(f"%{drug_name}%"))
            )
        ).scalars().all()
        med_ids = {m.id for m in med_rows}

        # Fetch adverse events reported by this user for the drug
        ae_rows = (
            await self._db.execute(
                select(AdverseEvent).where(
                    AdverseEvent.reporter_id == user_id,
                    AdverseEvent.medication_id.in_(med_ids) if med_ids else False,
                )
            )
        ).scalars().all()

        # Build DataFrames
        cycle_df = pd.DataFrame(
            [
                {
                    "date": r.date,
                    "cycle_day": r.cycle_day,
                    "phase": r.phase,
                    "phase_num": PHASE_ORDER.get(r.phase, 0),
                    "flow": r.flow_intensity or 0,
                    "mood": r.mood_score or 5,
                    "energy": r.energy_score or 5,
                }
                for r in cycle_rows
            ]
        )

        ae_df = pd.DataFrame(
            [
                {
                    "date": r.created_at.date(),
                    "severity_num": SEVERITY_WEIGHT.get(r.severity, 2),
                    "severity": r.severity,
                }
                for r in ae_rows
            ]
        )

        # If not enough data, return heuristic patterns
        if cycle_df.empty or ae_df.empty or len(cycle_df) < 3:
            return self._heuristic_patterns(drug_name, len(cycle_df) + len(ae_df))

        # Inner-join on date
        merged = cycle_df.merge(ae_df, on="date", how="inner")

        if merged.empty or len(merged) < 3:
            return self._heuristic_patterns(drug_name, len(cycle_df) + len(ae_df))

        patterns: list[CorrelatedPattern] = []

        # Correlation 1: phase_num vs severity
        r_phase = merged["phase_num"].corr(merged["severity_num"])
        if pd.notna(r_phase):
            peak_phase_idx = (
                merged.groupby("phase")["severity_num"].mean().idxmax()
            )
            patterns.append(
                CorrelatedPattern(
                    pattern="Cycle phase ↔ side-effect severity",
                    correlation=round(float(r_phase), 3),
                    phase=CyclePhase(peak_phase_idx),
                    description=(
                        f"Side effects tend to be more severe during the "
                        f"{peak_phase_idx} phase (r={r_phase:.2f})."
                    ),
                )
            )

        # Correlation 2: flow intensity vs severity
        r_flow = merged["flow"].corr(merged["severity_num"])
        if pd.notna(r_flow):
            patterns.append(
                CorrelatedPattern(
                    pattern="Flow intensity ↔ side-effect severity",
                    correlation=round(float(r_flow), 3),
                    phase=CyclePhase(
                        merged.loc[merged["flow"].idxmax(), "phase"]
                    ),
                    description=(
                        f"Higher flow intensity correlates with side-effect "
                        f"severity (r={r_flow:.2f})."
                    ),
                )
            )

        # Correlation 3: energy vs severity (expected negative)
        r_energy = merged["energy"].corr(merged["severity_num"])
        if pd.notna(r_energy):
            patterns.append(
                CorrelatedPattern(
                    pattern="Energy level ↔ side-effect severity",
                    correlation=round(float(r_energy), 3),
                    phase=CyclePhase(
                        merged.loc[merged["energy"].idxmin(), "phase"]
                    ),
                    description=(
                        f"Lower energy days show stronger side effects "
                        f"(r={r_energy:.2f})."
                    ),
                )
            )

        # Sort by absolute correlation, take top 3
        patterns.sort(key=lambda p: abs(p.correlation), reverse=True)

        return CorrelationResult(
            drug_name=drug_name,
            total_datapoints=len(merged),
            top_patterns=patterns[:3],
        )

    @staticmethod
    def _heuristic_patterns(drug_name: str, n: int) -> CorrelationResult:
        """Fallback when insufficient data for real correlation."""
        return CorrelationResult(
            drug_name=drug_name,
            total_datapoints=n,
            top_patterns=[
                CorrelatedPattern(
                    pattern="Luteal phase ↔ increased drug sensitivity",
                    correlation=0.0,
                    phase=CyclePhase.LUTEAL,
                    description=(
                        "Research suggests drug metabolism may slow during the "
                        "luteal phase, potentially increasing side-effect intensity. "
                        "Log more data for personalised correlations."
                    ),
                ),
                CorrelatedPattern(
                    pattern="Menstrual phase ↔ NSAID / anticoagulant risk",
                    correlation=0.0,
                    phase=CyclePhase.MENSTRUAL,
                    description=(
                        "Blood-thinning medications may intensify menstrual flow. "
                        "Track your cycle to build personalised predictions."
                    ),
                ),
                CorrelatedPattern(
                    pattern="Ovulatory phase ↔ hormonal medication peak",
                    correlation=0.0,
                    phase=CyclePhase.OVULATORY,
                    description=(
                        "Hormonal fluctuations around ovulation can alter drug "
                        "absorption. More logged data will refine this insight."
                    ),
                ),
            ],
        )

    # ──────────────────────────────────────────────
    # 2.  Cycle-drug warning (with Groq)
    # ──────────────────────────────────────────────

    async def get_cycle_drug_warning(
        self, user_id: uuid.UUID, drug_id: uuid.UUID
    ) -> CycleDrugWarning:
        """Return current phase, risk level, and AI-personalised warning."""

        # Latest cycle log for current phase
        latest_log = (
            await self._db.execute(
                select(HormoneCycleLog)
                .where(HormoneCycleLog.user_id == user_id)
                .order_by(HormoneCycleLog.date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        today = date.today()

        if latest_log:
            days_since = (today - latest_log.date).days
            current_day = latest_log.cycle_day + days_since
            current_phase = _phase_for_day(current_day)
        else:
            current_day = 1
            current_phase = CyclePhase.FOLLICULAR

        # Resolve drug name
        med = (
            await self._db.execute(select(Medication).where(Medication.id == drug_id))
        ).scalar_one_or_none()
        drug_name = med.name if med else "Unknown medication"

        # Compute risk from correlation data
        correlation = await self.correlate_cycle_drug_effects(user_id, drug_name)
        risk_level = self._assess_risk(current_phase, correlation)

        # Generate personalised warning via Groq
        warning_text = await self._generate_warning(
            drug_name, current_phase, current_day, risk_level, correlation
        )

        return CycleDrugWarning(
            drug_name=drug_name,
            current_phase=current_phase,
            cycle_day=current_day,
            risk_level=risk_level,
            personalized_warning_text=warning_text,
        )

    @staticmethod
    def _assess_risk(phase: CyclePhase, correlation: CorrelationResult) -> str:
        """Derive risk level from correlation strength and phase."""
        if not correlation.top_patterns:
            return "low"

        max_r = max(abs(p.correlation) for p in correlation.top_patterns)
        # Check if the peak-phase matches current phase
        phase_match = any(p.phase == phase for p in correlation.top_patterns)

        if max_r >= 0.7 and phase_match:
            return "critical"
        if max_r >= 0.5 and phase_match:
            return "high"
        if max_r >= 0.3 or phase_match:
            return "moderate"
        return "low"

    async def _generate_warning(
        self,
        drug_name: str,
        phase: CyclePhase,
        cycle_day: int,
        risk_level: str,
        correlation: CorrelationResult,
    ) -> str:
        patterns_text = "; ".join(
            f"{p.pattern} (r={p.correlation})" for p in correlation.top_patterns
        )
        chat = await self._groq.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a compassionate women's health pharmacist AI. "
                        "Write a short, plain-English personalised warning (2-3 sentences) "
                        "about how the patient's current menstrual cycle phase may affect "
                        "their medication. Be reassuring but informative. "
                        "Return JSON: {\"warning\": \"...\"}"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Drug: {drug_name}\n"
                        f"Current phase: {phase.value} (cycle day {cycle_day})\n"
                        f"Risk level: {risk_level}\n"
                        f"Correlation patterns: {patterns_text or 'none yet'}"
                    ),
                },
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        data = json.loads(chat.choices[0].message.content or "{}")
        return data.get("warning", f"You are in your {phase.value} phase. Please consult your doctor about {drug_name} timing.")

    # ──────────────────────────────────────────────
    # 3.  5-day forecast
    # ──────────────────────────────────────────────

    async def forecast(
        self, user_id: uuid.UUID, drug_names: list[str] | None = None
    ) -> ForecastResponse:
        """Predict the next 5 days' phases and drug sensitivity alerts."""

        latest_log = (
            await self._db.execute(
                select(HormoneCycleLog)
                .where(HormoneCycleLog.user_id == user_id)
                .order_by(HormoneCycleLog.date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        today = date.today()
        if latest_log:
            base_day = latest_log.cycle_day + (today - latest_log.date).days
        else:
            base_day = 1

        # Default drug list if none provided
        if not drug_names:
            drug_names = []

        days: list[ForecastDay] = []
        for offset in range(1, 6):
            future_date = today + timedelta(days=offset)
            cycle_day = base_day + offset
            phase = _phase_for_day(cycle_day)

            alerts: list[str] = []
            sensitivity = "normal"

            for dname in drug_names:
                corr = await self.correlate_cycle_drug_effects(user_id, dname)
                phase_match = any(p.phase == phase for p in corr.top_patterns)
                if phase_match and corr.top_patterns:
                    max_r = max(abs(p.correlation) for p in corr.top_patterns)
                    if max_r >= 0.5:
                        alerts.append(f"{dname}: high sensitivity expected during {phase.value}")
                        sensitivity = "high"
                    elif max_r >= 0.3:
                        alerts.append(f"{dname}: elevated sensitivity during {phase.value}")
                        if sensitivity != "high":
                            sensitivity = "elevated"

            # Phase-level heuristic alerts
            if phase == CyclePhase.MENSTRUAL and not alerts:
                alerts.append("Menstrual phase — monitor for increased bleeding with blood thinners")
            if phase == CyclePhase.LUTEAL and not alerts:
                alerts.append("Luteal phase — possible increased drug sensitivity")

            days.append(
                ForecastDay(
                    date=future_date,
                    predicted_phase=phase,
                    cycle_day=((cycle_day - 1) % DEFAULT_CYCLE_LENGTH) + 1,
                    drug_alerts=alerts,
                    sensitivity_level=sensitivity,
                )
            )

        return ForecastResponse(days=days)
