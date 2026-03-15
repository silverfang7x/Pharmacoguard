"""Celery application – uses Redis as broker and result backend."""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "pharmacoguard",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "check-medication-reminders": {
            "task": "send_medication_reminders",
            "schedule": 60.0,  # every 60 seconds
        },
        "daily-refill-predictions": {
            "task": "run_daily_refill_predictions",
            "schedule": crontab(hour=8, minute=0),  # daily at 8 AM UTC
        },
    },
)

celery_app.autodiscover_tasks(["app.services.tasks"])
