"""Medication Scheduler Service – MongoDB backed.

Collection: medication_schedules
Document schema:
{
    user_id: str,
    date: "YYYY-MM-DD",
    slots: [
        {
            time: "08:00",
            label: "Morning",
            medications: [{ name, dosage, color }],
            taken: false,
            taken_at: null
        },
        ...
    ]
}
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.db.mongodb import mongo_db

logger = logging.getLogger(__name__)

schedules_collection = mongo_db["medication_schedules"]

# ─── Default slot templates when no schedule exists yet ───
DEFAULT_SLOTS = [
    {"time": "08:00", "label": "Morning",   "medications": [], "taken": False, "taken_at": None},
    {"time": "13:00", "label": "Afternoon", "medications": [], "taken": False, "taken_at": None},
    {"time": "18:00", "label": "Evening",   "medications": [], "taken": False, "taken_at": None},
    {"time": "22:00", "label": "Night",     "medications": [], "taken": False, "taken_at": None},
]


async def ensure_daily_schedule(user_id: str, date: str) -> dict:
    """Fetch or create a daily schedule document."""
    doc = await schedules_collection.find_one({"user_id": user_id, "date": date})
    if doc:
        return doc
    # Auto-create with default slots
    new_doc = {"user_id": user_id, "date": date, "slots": DEFAULT_SLOTS}
    await schedules_collection.insert_one(new_doc)
    return new_doc


async def get_daily_schedule(user_id: str, date: str) -> dict:
    """Return the daily schedule, creating it if needed."""
    return await ensure_daily_schedule(user_id, date)


async def mark_slot_taken(user_id: str, date: str, slot_time: str) -> datetime | None:
    """Mark a specific slot as taken. Returns the taken_at timestamp or None if not found."""
    now = datetime.now(timezone.utc)
    result = await schedules_collection.update_one(
        {"user_id": user_id, "date": date, "slots.time": slot_time},
        {"$set": {"slots.$.taken": True, "slots.$.taken_at": now}},
    )
    if result.modified_count > 0:
        return now
    return None


async def get_month_heatmap(user_id: str, year: int, month: int) -> list[dict]:
    """Aggregate adherence data for every day in the given month."""
    prefix = f"{year}-{month:02d}"
    cursor = schedules_collection.find(
        {"user_id": user_id, "date": {"$regex": f"^{prefix}"}},
        {"_id": 0, "date": 1, "slots": 1},
    )
    days: list[dict] = []
    async for doc in cursor:
        slots = doc.get("slots", [])
        total = len(slots)
        taken = sum(1 for s in slots if s.get("taken"))
        adherence = (taken / total * 100) if total > 0 else 0.0
        days.append({
            "date": doc["date"],
            "adherence": round(adherence, 1),
            "total_slots": total,
            "taken_slots": taken,
        })
    return days


async def get_upcoming_slots(minutes_ahead: int = 10) -> list[dict]:
    """Find all slots across all users due in the next `minutes_ahead` minutes.

    Used by the Celery beat notification task.
    Returns list of {user_id, date, slot} dicts.
    """
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    target = now + timedelta(minutes=minutes_ahead)
    today = now.strftime("%Y-%m-%d")
    target_time = target.strftime("%H:%M")
    current_time = now.strftime("%H:%M")

    cursor = schedules_collection.find(
        {
            "date": today,
            "slots": {
                "$elemMatch": {
                    "taken": False,
                    "time": {"$gte": current_time, "$lte": target_time},
                }
            },
        },
        {"_id": 0, "user_id": 1, "date": 1, "slots": 1},
    )

    results: list[dict] = []
    async for doc in cursor:
        for slot in doc.get("slots", []):
            if (
                not slot.get("taken")
                and current_time <= slot["time"] <= target_time
            ):
                results.append({
                    "user_id": doc["user_id"],
                    "date": doc["date"],
                    "slot": slot,
                })
    return results
