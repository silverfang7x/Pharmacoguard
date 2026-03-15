"""Pydantic v2 schemas for medication scheduling / adherence."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class MedicationSlotItem(BaseModel):
    """A single medication within a time slot."""
    name: str
    dosage: str = ""
    color: str = "#6366f1"  # default indigo pill colour for the frontend


class ScheduleSlot(BaseModel):
    """One time-slot in a day's medication schedule."""
    time: str  # e.g. "08:00"
    label: str = ""  # e.g. "Morning"
    medications: list[MedicationSlotItem] = []
    taken: bool = False
    taken_at: datetime | None = None


class DailySchedule(BaseModel):
    """Full schedule document for a single day."""
    user_id: str
    date: str  # ISO date string YYYY-MM-DD
    slots: list[ScheduleSlot] = []


# ────── Request / Response models ──────


class LogTakenRequest(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    slot_time: str  # must match a slot's `time` value


class LogTakenResponse(BaseModel):
    success: bool
    taken_at: datetime | None = None


class DailyScheduleResponse(BaseModel):
    date: str
    slots: list[ScheduleSlot]
    progress: float = 0.0  # 0-100 percentage


class HeatmapDay(BaseModel):
    date: str
    adherence: float  # 0-100
    total_slots: int
    taken_slots: int


class HeatmapResponse(BaseModel):
    year: int
    month: int
    days: list[HeatmapDay]
