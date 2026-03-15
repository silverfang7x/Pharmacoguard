"""Gamification / Streak API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.gamification import StreakResponse
from app.services.streak_service import compute_streak

router = APIRouter()


@router.get("/streak/{patient_id}", response_model=StreakResponse)
async def get_streak(
    patient_id: str,
    _user: dict = Depends(get_current_user),
) -> StreakResponse:
    """Return streak, badges, and weekly progress for a patient."""
    return await compute_streak(patient_id)
