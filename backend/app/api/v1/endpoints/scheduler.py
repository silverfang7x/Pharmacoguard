"""Scheduler endpoints – medication schedule & adherence tracking."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.scheduler import (
    DailyScheduleResponse,
    HeatmapDay,
    HeatmapResponse,
    LogTakenRequest,
    LogTakenResponse,
    ScheduleSlot,
)
from app.services.scheduler_service import (
    get_daily_schedule,
    get_month_heatmap,
    mark_slot_taken,
)

router = APIRouter()


def _progress(slots: list[dict]) -> float:
    if not slots:
        return 0.0
    taken = sum(1 for s in slots if s.get("taken"))
    return round(taken / len(slots) * 100, 1)


@router.post("/log-taken", response_model=LogTakenResponse)
async def log_taken(
    payload: LogTakenRequest,
    user: dict = Depends(get_current_user),
):
    """Mark a specific medication slot as taken."""
    user_id: str = user["sub"]
    taken_at = await mark_slot_taken(user_id, payload.date, payload.slot_time)
    return LogTakenResponse(success=taken_at is not None, taken_at=taken_at)


@router.get("/daily/{date}", response_model=DailyScheduleResponse)
async def daily_schedule(
    date: str,
    user: dict = Depends(get_current_user),
):
    """Get the medication schedule for a specific date."""
    user_id: str = user["sub"]
    doc = await get_daily_schedule(user_id, date)
    slots_raw = doc.get("slots", [])
    return DailyScheduleResponse(
        date=doc.get("date", date),
        slots=[ScheduleSlot(**s) for s in slots_raw],
        progress=_progress(slots_raw),
    )


@router.get("/heatmap/{year}/{month}", response_model=HeatmapResponse)
async def heatmap(
    year: int,
    month: int,
    user: dict = Depends(get_current_user),
):
    """Get monthly adherence heatmap data."""
    user_id: str = user["sub"]
    days_raw = await get_month_heatmap(user_id, year, month)
    return HeatmapResponse(
        year=year,
        month=month,
        days=[HeatmapDay(**d) for d in days_raw],
    )
