"""AI / LLM-powered analysis endpoints (Groq – llama-3.3-70b-versatile)."""

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.ai import (
    DrugInteractionRequest,
    DrugInteractionResponse,
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
)
from app.services.groq_service import GroqService

router = APIRouter()


@router.post("/drug-interactions", response_model=DrugInteractionResponse)
async def check_drug_interactions(
    payload: DrugInteractionRequest,
    _user: dict = Depends(get_current_user),
):
    service = GroqService()
    return await service.check_drug_interactions(payload)


@router.post("/symptom-analysis", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(
    payload: SymptomAnalysisRequest,
    _user: dict = Depends(get_current_user),
):
    service = GroqService()
    return await service.analyze_symptoms(payload)
