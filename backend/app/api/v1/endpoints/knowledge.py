"""Prescription Knowledge Vault – drug info + audio explanation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.knowledge import (
    AudioExplanationRequest,
    AudioExplanationResponse,
    DrugInfoResponse,
)
from app.services.knowledge_service import DrugKnowledgeService
from app.services.audio_service import AudioService

router = APIRouter()

_knowledge = DrugKnowledgeService()
_audio = AudioService()


@router.get("/{drug_name}/info", response_model=DrugInfoResponse)
async def get_drug_info(drug_name: str) -> DrugInfoResponse:
    """Return AI-generated plain-English info about a medication."""
    try:
        return await _knowledge.get_drug_info(drug_name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc


@router.post("/audio-explanation", response_model=AudioExplanationResponse)
async def audio_explanation(body: AudioExplanationRequest) -> AudioExplanationResponse:
    """Generate TTS audio via ElevenLabs, cache in Supabase Storage."""
    try:
        transcript = body.text or await _knowledge.generate_transcript(body.drug_name)
        audio_url = await _audio.generate_and_store(body.drug_name, transcript)
        return AudioExplanationResponse(audio_url=audio_url, transcript=transcript)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Audio service error: {exc}") from exc
