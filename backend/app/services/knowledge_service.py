"""Drug Knowledge Service – uses Groq LLM to generate plain-English drug info."""

from __future__ import annotations

import json
import hashlib

from groq import AsyncGroq
from redis.asyncio import Redis

from app.core.config import settings
from app.db.redis import redis_client
from app.schemas.knowledge import DrugInfoResponse

MODEL = "llama-3.3-70b-versatile"
CACHE_TTL = 60 * 60 * 24 * 7  # 7 days


def _cache_key(drug_name: str) -> str:
    slug = hashlib.sha256(drug_name.lower().strip().encode()).hexdigest()[:16]
    return f"drug_info:{slug}"


class DrugKnowledgeService:
    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self._redis: Redis = redis_client  # type: ignore[assignment]

    async def get_drug_info(self, drug_name: str) -> DrugInfoResponse:
        cache_k = _cache_key(drug_name)
        cached = await self._redis.get(cache_k)
        if cached:
            return DrugInfoResponse(**json.loads(cached))

        system_prompt = (
            "You are a friendly clinical pharmacist AI. "
            "Given a drug name, return a JSON object with EXACTLY these keys:\n"
            "- plain_english_use: one-paragraph plain-English explanation of what the drug does\n"
            "- how_to_take: clear instructions on how to take it (timing, with/without food, etc.)\n"
            "- side_effects_simple: common side effects in simple language\n"
            "- why_prescribed_for_patient: typical medical conditions this drug is prescribed for\n"
            "- food_interactions: foods or drinks to avoid while on this medication\n"
            "- cycle_impact_warning: any impact on menstrual cycle, hormonal balance, or "
            "reproductive health (write 'No known cycle impact' if none)\n"
            "Keep language at a 6th-grade reading level. Be concise but thorough."
        )

        chat = await self._client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Drug name: {drug_name}"},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        data = json.loads(chat.choices[0].message.content or "{}")
        result = DrugInfoResponse(
            drug_name=drug_name,
            plain_english_use=data.get("plain_english_use", ""),
            how_to_take=data.get("how_to_take", ""),
            side_effects_simple=data.get("side_effects_simple", ""),
            why_prescribed_for_patient=data.get("why_prescribed_for_patient", ""),
            food_interactions=data.get("food_interactions", ""),
            cycle_impact_warning=data.get("cycle_impact_warning", "No known cycle impact"),
        )

        await self._redis.set(cache_k, result.model_dump_json(), ex=CACHE_TTL)
        return result

    async def generate_transcript(self, drug_name: str) -> str:
        """Generate a concise spoken-word transcript for TTS."""
        info = await self.get_drug_info(drug_name)
        return (
            f"{info.drug_name}. "
            f"{info.plain_english_use} "
            f"How to take it: {info.how_to_take} "
            f"Common side effects include: {info.side_effects_simple} "
            f"Food interactions: {info.food_interactions}"
        )
