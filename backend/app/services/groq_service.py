"""Groq LLM service – wraps the Groq SDK for drug-interaction & symptom analysis."""

from __future__ import annotations

import json

from groq import AsyncGroq

from app.core.config import settings
from app.schemas.ai import (
    DrugInteractionRequest,
    DrugInteractionResponse,
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
)

MODEL = "llama-3.3-70b-versatile"


class GroqService:
    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def check_drug_interactions(
        self, req: DrugInteractionRequest
    ) -> DrugInteractionResponse:
        medications_str = ", ".join(req.medications)
        system_prompt = (
            "You are a clinical pharmacology AI assistant. "
            "Analyse potential drug-drug interactions. "
            "Return valid JSON with keys: interactions (list of objects with "
            "drug_pair, severity, description), summary."
        )
        user_prompt = f"Medications: {medications_str}"
        if req.patient_context:
            user_prompt += f"\nPatient context: {req.patient_context}"

        chat = await self._client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        data = json.loads(chat.choices[0].message.content or "{}")
        return DrugInteractionResponse(
            interactions=data.get("interactions", []),
            summary=data.get("summary", ""),
            model=MODEL,
        )

    async def analyze_symptoms(self, req: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
        symptoms_str = ", ".join(req.symptoms)
        meds_str = ", ".join(req.current_medications) if req.current_medications else "none"
        system_prompt = (
            "You are a clinical pharmacology AI assistant. "
            "Analyse the reported symptoms in the context of current medications. "
            "Return valid JSON with keys: analysis, risk_level (low/moderate/high/critical), "
            "recommendations (list of strings)."
        )
        user_prompt = f"Symptoms: {symptoms_str}\nCurrent medications: {meds_str}"

        chat = await self._client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        data = json.loads(chat.choices[0].message.content or "{}")
        return SymptomAnalysisResponse(
            analysis=data.get("analysis", ""),
            risk_level=data.get("risk_level", "moderate"),
            recommendations=data.get("recommendations", []),
            model=MODEL,
        )
