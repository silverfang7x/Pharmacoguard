"""Celery background tasks."""

import asyncio
import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):  # type: ignore[no-untyped-def]
    """Run an async coroutine from synchronous Celery task context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task(name="log_ai_interaction")
def log_ai_interaction(user_id: str, request_type: str, payload: dict, response: dict) -> None:
    """Persist AI interaction to MongoDB (runs asynchronously via Celery)."""
    from app.db.mongodb import ai_interactions_collection

    doc = {
        "user_id": user_id,
        "request_type": request_type,
        "payload": payload,
        "response": response,
        "created_at": datetime.now(timezone.utc),
    }
    _run_async(ai_interactions_collection.insert_one(doc))


@celery_app.task(name="send_medication_reminders")
def send_medication_reminders() -> None:
    """Celery beat task: check for medication slots due in the next 10 minutes
    and send push notifications to users.

    Runs every 60 seconds via the beat schedule configured in celery_app.
    """
    from app.services.scheduler_service import get_upcoming_slots
    from app.db.mongodb import logs_collection

    upcoming = _run_async(get_upcoming_slots(minutes_ahead=10))

    for item in upcoming:
        user_id = item["user_id"]
        slot = item["slot"]
        med_names = ", ".join(m.get("name", "?") for m in slot.get("medications", []))
        label = slot.get("label", slot.get("time", ""))

        # Log the notification (in production, integrate with FCM / APNs / WebPush)
        notification = {
            "user_id": user_id,
            "type": "medication_reminder",
            "title": f"Time for your {label} medications",
            "body": f"Don't forget to take: {med_names}" if med_names else "You have medications due soon.",
            "slot_time": slot.get("time"),
            "date": item["date"],
            "sent_at": datetime.now(timezone.utc),
        }
        _run_async(logs_collection.insert_one(notification))
        logger.info("Reminder sent → user=%s slot=%s", user_id, slot.get("time"))


@celery_app.task(name="run_daily_refill_predictions")
def run_daily_refill_predictions() -> None:
    """Celery beat task: run refill predictions for all active patients daily at 8 AM.

    If a medication is predicted to run out within 3 days, log an alert.
    """
    from app.db.mongodb import medication_schedules_collection, logs_collection
    from app.services.refill_pred import predict_refills

    # Get distinct patient IDs from recent schedules
    pipeline = [
        {"$group": {"_id": "$user_id"}},
    ]
    user_docs = _run_async(
        medication_schedules_collection.aggregate(pipeline).to_list(length=10000)
    )

    for doc in user_docs:
        patient_id = doc["_id"]
        try:
            result = _run_async(predict_refills(patient_id))
            for pred in result.predictions:
                if pred.should_alert:
                    alert = {
                        "user_id": patient_id,
                        "type": "refill_alert",
                        "title": f"Refill needed: {pred.drug}",
                        "body": (
                            f"{pred.drug} is estimated to run out on "
                            f"{pred.estimated_empty_date.isoformat()} "
                            f"({pred.days_remaining:.0f} days remaining)."
                        ),
                        "drug": pred.drug,
                        "days_remaining": pred.days_remaining,
                        "sent_at": datetime.now(timezone.utc),
                    }
                    _run_async(logs_collection.insert_one(alert))
                    logger.info(
                        "Refill alert → user=%s drug=%s days=%.1f",
                        patient_id, pred.drug, pred.days_remaining,
                    )
        except Exception:
            logger.exception("Refill prediction failed for user=%s", patient_id)
