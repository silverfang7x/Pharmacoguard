"""Refill Predictor API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.gamification import RefillPredictionsResponse
from app.services.refill_pred import predict_refills

router = APIRouter()


@router.get("/predictions/{patient_id}", response_model=RefillPredictionsResponse)
async def get_predictions(
    patient_id: str,
    _user: dict = Depends(get_current_user),
) -> RefillPredictionsResponse:
    """Return ML-based refill predictions for a patient."""
    return await predict_refills(patient_id)
