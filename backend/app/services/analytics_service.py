"""Analytics service — aggregates anonymised adherence, side-effect ​& DDI data from MongoDB."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict

from app.db.mongodb import medication_schedules_collection, ai_interactions_collection, logs_collection


async def _patient_ids_for_doctor(doctor_id: str) -> list[str]:
    """Return distinct patient IDs associated with a doctor.

    Uses the medication_schedules collection where prescribing doctor is stored.
    Falls back to all patients if no doctor-specific flag exists.
    """
    cursor = medication_schedules_collection.find(
        {"doctor_id": doctor_id},
        {"patient_id": 1},
    )
    ids: set[str] = set()
    async for doc in cursor:
        ids.add(doc["patient_id"])
    return list(ids)


async def _all_patient_ids() -> list[str]:
    ids = await medication_schedules_collection.distinct("patient_id")
    return ids


# ─── Doctor Overview ────────────────────────────────────────────────


async def compute_doctor_overview(doctor_id: str) -> dict:
    patient_ids = await _patient_ids_for_doctor(doctor_id)
    if not patient_ids:
        patient_ids = await _all_patient_ids()

    total_patients = len(patient_ids)
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # ── Per-drug adherence ──
    drug_taken: dict[str, int] = defaultdict(int)
    drug_total: dict[str, int] = defaultdict(int)

    cursor = medication_schedules_collection.find(
        {"patient_id": {"$in": patient_ids}},
    )
    async for doc in cursor:
        drug = doc.get("drug_name", "Unknown")
        for slot in doc.get("schedule", []):
            drug_total[drug] += 1
            if slot.get("taken"):
                drug_taken[drug] += 1

    drug_adherence = {
        drug: drug_taken[drug] / drug_total[drug] if drug_total[drug] else 0.0
        for drug in drug_total
    }
    avg_adherence = (
        sum(drug_adherence.values()) / len(drug_adherence) if drug_adherence else 0.0
    )

    # Top 5 worst-adhered drugs
    sorted_drugs = sorted(drug_adherence.items(), key=lambda x: x[1])
    top_non_adhered = [
        {"drug_name": d, "adherence_rate": round(r, 3)} for d, r in sorted_drugs[:5]
    ]

    # ── Common side effects ──
    side_effects: list[dict] = []
    se_counter: dict[str, Counter[str]] = defaultdict(Counter)
    se_cursor = logs_collection.find(
        {"patient_id": {"$in": patient_ids}, "event_type": "side_effect"},
    )
    async for doc in se_cursor:
        drug = doc.get("drug_name", "Unknown")
        effect = doc.get("side_effect", "Unknown")
        se_counter[drug][effect] += 1

    for drug, counter in se_counter.items():
        for effect, count in counter.most_common(3):
            side_effects.append(
                {"drug_name": drug, "side_effect": effect, "count": count}
            )

    # ── DDI flags this month ──
    ddi_count = await logs_collection.count_documents(
        {
            "event_type": "ddi_flag",
            "created_at": {"$gte": thirty_days_ago},
            "patient_id": {"$in": patient_ids},
        }
    )

    return {
        "total_patients": total_patients,
        "avg_adherence_rate": round(avg_adherence, 3),
        "top_non_adhered_drugs": top_non_adhered,
        "common_side_effects_by_drug": side_effects,
        "ddi_flags_this_month": ddi_count,
    }


# ─── Drug Dropout Analysis ─────────────────────────────────────────


async def compute_dropout_analysis(drug_id: str) -> dict:
    """Aggregate adherence drop-off over time for a specific drug."""

    cursor = medication_schedules_collection.find({"drug_id": drug_id})

    daily_taken: dict[int, int] = defaultdict(int)
    daily_total: dict[int, int] = defaultdict(int)
    dropout_reasons: Counter[str] = Counter()
    active_week1 = 0
    dropped_week1 = 0
    active_week4 = 0
    dropped_week4 = 0

    drug_name = "Unknown"

    async for doc in cursor:
        drug_name = doc.get("drug_name", drug_name)
        start_date = doc.get("start_date")
        if not start_date:
            continue
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date)

        for slot in doc.get("schedule", []):
            slot_date = slot.get("date")
            if not slot_date:
                continue
            if isinstance(slot_date, str):
                slot_date = datetime.fromisoformat(slot_date)
            day_offset = (slot_date - start_date).days
            if day_offset < 0:
                continue
            daily_total[day_offset] += 1
            if slot.get("taken"):
                daily_taken[day_offset] += 1

        # Dropout heuristic: if last 3 slots are all missed → dropout
        slots = doc.get("schedule", [])
        if len(slots) >= 3 and all(not s.get("taken") for s in slots[-3:]):
            reason = doc.get("dropout_reason", "Non-compliance")
            dropout_reasons[reason] += 1

        # Week-boundary checks
        total_days = max(daily_total.keys(), default=0)
        if total_days >= 7:
            active_week1 += 1
            wk1_slots = [s for i, s in enumerate(slots) if i < 7]
            if wk1_slots and all(not s.get("taken") for s in wk1_slots[-3:]):
                dropped_week1 += 1
        if total_days >= 28:
            active_week4 += 1
            wk4_slots = [s for i, s in enumerate(slots) if 21 <= i < 28]
            if wk4_slots and all(not s.get("taken") for s in wk4_slots[-3:]):
                dropped_week4 += 1

    # Build time series (first 30 days)
    time_series = []
    for day in range(min(30, max(daily_total.keys(), default=0) + 1)):
        total = daily_total.get(day, 0)
        taken = daily_taken.get(day, 0)
        rate = taken / total if total else 0.0
        time_series.append({"day": day, "adherence_rate": round(rate, 3)})

    return {
        "drug_name": drug_name,
        "dropout_rate_week1": round(dropped_week1 / active_week1, 3) if active_week1 else 0.0,
        "dropout_rate_week4": round(dropped_week4 / active_week4, 3) if active_week4 else 0.0,
        "top_dropout_reasons": [r for r, _ in dropout_reasons.most_common(5)],
        "time_series_adherence": time_series,
    }


# ─── Dashboard Extras ──────────────────────────────────────────────


async def compute_adherence_distribution(patient_ids: list[str]) -> list[dict]:
    """Bucket patients by overall adherence %."""
    buckets = {
        "90-100%": 0, "80-89%": 0, "70-79%": 0,
        "60-69%": 0, "<60%": 0,
    }

    for pid in patient_ids:
        taken = 0
        total = 0
        cursor = medication_schedules_collection.find({"patient_id": pid})
        async for doc in cursor:
            for slot in doc.get("schedule", []):
                total += 1
                if slot.get("taken"):
                    taken += 1
        rate = (taken / total * 100) if total else 100
        if rate >= 90:
            buckets["90-100%"] += 1
        elif rate >= 80:
            buckets["80-89%"] += 1
        elif rate >= 70:
            buckets["70-79%"] += 1
        elif rate >= 60:
            buckets["60-69%"] += 1
        else:
            buckets["<60%"] += 1

    return [{"bucket": k, "count": v} for k, v in buckets.items()]


async def compute_low_adherence_patients(patient_ids: list[str], limit: int = 10) -> list[dict]:
    """Return patients with the worst adherence this week, anonymised."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    results: list[dict] = []
    for pid in patient_ids:
        taken = 0
        total = 0
        missed = 0
        primary_drug = "Unknown"
        cursor = medication_schedules_collection.find({"patient_id": pid})
        async for doc in cursor:
            primary_drug = doc.get("drug_name", primary_drug)
            for slot in doc.get("schedule", []):
                slot_date = slot.get("date")
                if slot_date:
                    if isinstance(slot_date, str):
                        slot_date = datetime.fromisoformat(slot_date)
                    if slot_date < week_ago:
                        continue
                total += 1
                if slot.get("taken"):
                    taken += 1
                else:
                    missed += 1

        rate = taken / total if total else 1.0
        initials = f"P-{pid[:4].upper()}"
        results.append({
            "patient_id": pid,
            "initials": initials,
            "adherence_rate": round(rate, 3),
            "missed_doses_this_week": missed,
            "primary_drug": primary_drug,
        })

    results.sort(key=lambda x: x["adherence_rate"])
    return results[:limit]


async def count_refill_alerts(patient_ids: list[str]) -> int:
    """Count refill alerts logged in the last 7 days."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    return await logs_collection.count_documents({
        "event_type": "refill_alert",
        "patient_id": {"$in": patient_ids},
        "created_at": {"$gte": week_ago},
    })
