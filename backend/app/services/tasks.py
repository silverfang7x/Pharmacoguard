"""Celery background tasks."""

from app.core.celery_app import celery_app


@celery_app.task(name="log_ai_interaction")
def log_ai_interaction(user_id: str, request_type: str, payload: dict, response: dict) -> None:
    """Persist AI interaction to MongoDB (runs asynchronously via Celery)."""
    import asyncio
    from app.db.mongodb import ai_interactions_collection
    from datetime import datetime, timezone

    doc = {
        "user_id": user_id,
        "request_type": request_type,
        "payload": payload,
        "response": response,
        "created_at": datetime.now(timezone.utc),
    }

    asyncio.get_event_loop().run_until_complete(ai_interactions_collection.insert_one(doc))
