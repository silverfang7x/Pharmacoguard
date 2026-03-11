"""Pydantic v2 schemas for AI / LLM interactions."""

from __future__ import annotations

from pydantic import BaseModel


class DrugInteractionRequest(BaseModel):
    medications: list[str]
    patient_context: str | None = None


class DrugInteractionResponse(BaseModel):
    interactions: list[dict]
    summary: str
    model: str


class SymptomAnalysisRequest(BaseModel):
    symptoms: list[str]
    current_medications: list[str] | None = None


class SymptomAnalysisResponse(BaseModel):
    analysis: str
    risk_level: str
    recommendations: list[str]
    model: str
