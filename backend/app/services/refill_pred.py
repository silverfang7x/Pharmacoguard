"""Refill Predictor – scikit-learn LinearRegression on adherence data.

Trains per-user models on medication schedule data from MongoDB, predicting
days_until_empty for each active medication.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

import numpy as np
from sklearn.linear_model import LinearRegression

from app.db.mongodb import medication_schedules_collection
from app.schemas.gamification import RefillPrediction, RefillPredictionsResponse

logger = logging.getLogger(__name__)

# Default pill-count assumptions when real inventory isn't tracked
DEFAULT_PILL_COUNT = 30
DEFAULT_DOSES_PER_DAY = 2
ALERT_THRESHOLD_DAYS = 3


async def _fetch_adherence_history(patient_id: str, lookback_days: int = 90) -> list[dict]:
    """Pull daily schedule docs from MongoDB for the patient."""
    cutoff = (date.today() - timedelta(days=lookback_days)).isoformat()
    cursor = medication_schedules_collection.find(
        {"user_id": patient_id, "date": {"$gte": cutoff}},
    ).sort("date", 1)
    return await cursor.to_list(length=lookback_days + 1)


def _compute_features(history: list[dict], day_idx: int) -> dict | None:
    """Build feature vector for a single day within the history window."""
    if day_idx < 7:
        return None  # need at least 7 days of history

    # Adherence = taken_slots / total_slots per day
    def day_adherence(doc: dict) -> float:
        slots = doc.get("slots", [])
        if not slots:
            return 0.0
        taken = sum(1 for s in slots if s.get("taken"))
        return taken / len(slots)

    recent_7 = [day_adherence(history[i]) for i in range(max(0, day_idx - 7), day_idx)]
    recent_30 = [day_adherence(history[i]) for i in range(max(0, day_idx - 30), day_idx)]

    avg_7d = float(np.mean(recent_7)) if recent_7 else 0.0
    avg_30d = float(np.mean(recent_30)) if recent_30 else 0.0
    doses = DEFAULT_DOSES_PER_DAY
    pill_count = max(0, DEFAULT_PILL_COUNT - day_idx * doses * avg_30d)

    return {
        "avg_daily_adherence_7d": avg_7d,
        "avg_daily_adherence_30d": avg_30d,
        "doses_per_day": doses,
        "current_pill_count": pill_count,
        "days_since_refill": day_idx,
    }


def _train_and_predict(history: list[dict]) -> tuple[float, float]:
    """Train LinearRegression on history, return (days_until_empty, confidence).

    Returns a (predicted_days, r2_score) tuple.
    """
    X_rows: list[list[float]] = []
    y_vals: list[float] = []

    for i in range(7, len(history)):
        features = _compute_features(history, i)
        if features is None:
            continue
        X_rows.append([
            features["avg_daily_adherence_7d"],
            features["avg_daily_adherence_30d"],
            features["doses_per_day"],
            features["current_pill_count"],
            features["days_since_refill"],
        ])
        # Target: how many days until end of pill count from this day
        remaining_pills = features["current_pill_count"]
        adherence = max(features["avg_daily_adherence_7d"], 0.1)
        days_left = remaining_pills / (features["doses_per_day"] * adherence)
        y_vals.append(days_left)

    if len(X_rows) < 3:
        # Not enough training data — use simple heuristic
        avg_adh = 0.8
        days_left = DEFAULT_PILL_COUNT / (DEFAULT_DOSES_PER_DAY * avg_adh)
        return days_left, 0.5

    X = np.array(X_rows)
    y = np.array(y_vals)

    model = LinearRegression()
    model.fit(X, y)

    # Predict for "today" = last entry
    today_features = _compute_features(history, len(history) - 1)
    if today_features is None:
        return float(np.mean(y)), 0.5

    today_X = np.array([[
        today_features["avg_daily_adherence_7d"],
        today_features["avg_daily_adherence_30d"],
        today_features["doses_per_day"],
        today_features["current_pill_count"],
        today_features["days_since_refill"],
    ]])

    predicted = float(model.predict(today_X)[0])
    # Confidence = clamped R² score
    r2 = float(model.score(X, y))
    confidence = max(0.0, min(1.0, r2))

    return max(0.0, predicted), confidence


def _extract_drug_names(history: list[dict]) -> list[str]:
    """Pull unique medication names from the schedule documents."""
    names: set[str] = set()
    for doc in history:
        for slot in doc.get("slots", []):
            for med in slot.get("medications", []):
                name = med.get("name")
                if name:
                    names.add(name)
    return sorted(names) if names else ["General Medication"]


async def predict_refills(patient_id: str) -> RefillPredictionsResponse:
    """Run the refill prediction pipeline for a patient."""
    history = await _fetch_adherence_history(patient_id)

    if not history:
        # No data — return default predictions
        return RefillPredictionsResponse(
            patient_id=patient_id,
            predictions=[],
            generated_at=datetime.now(timezone.utc),
        )

    days_left, confidence = _train_and_predict(history)
    drug_names = _extract_drug_names(history)
    today = date.today()

    predictions = []
    for drug in drug_names:
        empty_date = today + timedelta(days=int(days_left))
        predictions.append(
            RefillPrediction(
                drug=drug,
                estimated_empty_date=empty_date,
                confidence_score=round(confidence, 2),
                days_remaining=round(days_left, 1),
                should_alert=days_left <= ALERT_THRESHOLD_DAYS,
            )
        )

    return RefillPredictionsResponse(
        patient_id=patient_id,
        predictions=predictions,
        generated_at=datetime.now(timezone.utc),
    )
