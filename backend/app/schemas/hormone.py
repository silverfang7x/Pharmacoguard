"""Pydantic v2 schemas for the Hormone-Sync module."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class CyclePhase(StrEnum):
    MENSTRUAL = "menstrual"
    FOLLICULAR = "follicular"
    OVULATORY = "ovulatory"
    LUTEAL = "luteal"


# ── Cycle log CRUD ──


class CycleLogCreate(BaseModel):
    date: date
    cycle_day: int = Field(ge=1, le=45)
    phase: CyclePhase
    flow_intensity: float | None = Field(None, ge=0, le=5)
    mood_score: float | None = Field(None, ge=1, le=10)
    energy_score: float | None = Field(None, ge=1, le=10)


class CycleLogRead(CycleLogCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


# ── Correlation results ──


class CorrelatedPattern(BaseModel):
    pattern: str
    correlation: float = Field(description="Pearson r value")
    phase: CyclePhase
    description: str


class CorrelationResult(BaseModel):
    drug_name: str
    total_datapoints: int
    top_patterns: list[CorrelatedPattern]


# ── Cycle-drug warning ──


class CycleDrugWarning(BaseModel):
    drug_name: str
    current_phase: CyclePhase
    cycle_day: int
    risk_level: str  # low / moderate / high / critical
    personalized_warning_text: str


# ── Forecast ──


class ForecastDay(BaseModel):
    date: date
    predicted_phase: CyclePhase
    cycle_day: int
    drug_alerts: list[str]
    sensitivity_level: str  # normal / elevated / high


class ForecastResponse(BaseModel):
    days: list[ForecastDay]
