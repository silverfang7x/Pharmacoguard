"""Pydantic v2 schemas for the DDI Safety Engine."""

from __future__ import annotations

from pydantic import BaseModel


class DDICheckRequest(BaseModel):
    patient_id: str
    new_drug: str
    existing_medications: list[str]


class DDIInteraction(BaseModel):
    drug_a: str
    drug_b: str
    severity: str  # CRITICAL | HIGH | MODERATE | LOW
    description: str
    source: str


class DDICheckResponse(BaseModel):
    interactions: list[DDIInteraction]
    overall_risk_score: str
    llm_explanation: str
