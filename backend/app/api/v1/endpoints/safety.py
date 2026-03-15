"""Safety endpoints – Drug-Drug Interaction checker."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from groq import AsyncGroq

from app.core.config import settings
from app.core.security import get_current_user
from app.schemas.safety import DDICheckRequest, DDICheckResponse, DDIInteraction
from app.services.ddi_engine import check_interactions, compute_overall_risk

router = APIRouter()

MODEL = "llama-3.3-70b-versatile"


async def _generate_explanation(interactions_dicts: list[dict], drug_list: list[str]) -> str:
    """Ask Groq for a plain-English explanation of the found interactions."""
    if not interactions_dicts:
        return "No clinically significant drug-drug interactions were identified."

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    system_prompt = (
        "You are a clinical pharmacology AI. Given a list of drug-drug interactions, "
        "produce a concise, patient-friendly explanation of the risks. "
        "Highlight the most dangerous interactions first. "
        "Use plain English, avoid jargon. Return plain text (no JSON)."
    )
    user_prompt = (
        f"Drugs being checked: {', '.join(drug_list)}\n\n"
        f"Interactions found:\n{json.dumps(interactions_dicts, indent=2)}"
    )

    chat = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=1024,
    )

    return (chat.choices[0].message.content or "").strip()


@router.post("/check-interactions", response_model=DDICheckResponse)
async def check_ddi(
    payload: DDICheckRequest,
    _user: dict = Depends(get_current_user),
):
    """Check drug-drug interactions for a patient's medication list.

    1. Merges new_drug into existing_medications
    2. Runs the DDI engine (OpenFDA + RxNorm + Redis cache)
    3. Generates a plain-English LLM explanation via Groq
    """
    full_list = [payload.new_drug, *payload.existing_medications]

    results = await check_interactions(full_list)

    interactions = [
        DDIInteraction(**r.to_dict())
        for r in results
    ]
    interactions_dicts = [i.model_dump() for i in interactions]

    overall_risk = compute_overall_risk(results)
    explanation = await _generate_explanation(interactions_dicts, full_list)

    return DDICheckResponse(
        interactions=interactions,
        overall_risk_score=overall_risk,
        llm_explanation=explanation,
    )
