"""Pydantic v2 schemas for the Prescription Knowledge Vault."""

from __future__ import annotations

from pydantic import BaseModel


class DrugInfoResponse(BaseModel):
    drug_name: str
    plain_english_use: str
    how_to_take: str
    side_effects_simple: str
    why_prescribed_for_patient: str
    food_interactions: str
    cycle_impact_warning: str


class AudioExplanationRequest(BaseModel):
    drug_name: str
    text: str | None = None


class AudioExplanationResponse(BaseModel):
    audio_url: str
    transcript: str
