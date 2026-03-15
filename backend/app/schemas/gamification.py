"""Pydantic v2 schemas for the Refill Predictor & Gamification modules."""

from __future__ import annotations

from datetime import date, datetime
from pydantic import BaseModel, Field


# ── Refill Prediction ──


class RefillPrediction(BaseModel):
    drug: str
    estimated_empty_date: date
    confidence_score: float = Field(ge=0.0, le=1.0)
    days_remaining: float
    should_alert: bool


class RefillPredictionsResponse(BaseModel):
    patient_id: str
    predictions: list[RefillPrediction]
    generated_at: datetime


# ── Gamification / Streak ──


class Badge(BaseModel):
    name: str
    tier: str  # bronze / silver / gold
    icon: str  # emoji
    earned_at: date | None = None
    description: str


class StreakResponse(BaseModel):
    patient_id: str
    current_streak: int
    longest_streak: int
    total_perfect_days: int
    badges_earned: list[Badge]
    next_milestone: int
    weekly_progress: list[bool]  # last 7 days, True = perfect
