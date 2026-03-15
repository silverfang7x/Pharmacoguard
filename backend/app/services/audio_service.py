"""ElevenLabs TTS service – generates audio and caches in Supabase Storage."""

from __future__ import annotations

import hashlib
import uuid

import httpx

from app.core.config import settings

ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # "Rachel" – default female voice
STORAGE_BUCKET = "audio-explanations"


def _audio_key(drug_name: str) -> str:
    slug = hashlib.sha256(drug_name.lower().strip().encode()).hexdigest()[:16]
    return f"{slug}.mp3"


class AudioService:
    def __init__(self) -> None:
        self._elevenlabs_key = settings.ELEVENLABS_API_KEY
        self._sb_url = settings.SUPABASE_URL
        self._sb_service_key = settings.SUPABASE_SERVICE_ROLE_KEY

    async def generate_and_store(self, drug_name: str, transcript: str) -> str:
        """Generate TTS audio, upload to Supabase Storage, return public URL."""

        object_key = _audio_key(drug_name)

        # Check if already cached in Supabase Storage
        existing_url = await self._get_public_url(object_key)
        if existing_url:
            return existing_url

        audio_bytes = await self._synthesize(transcript)
        await self._upload(object_key, audio_bytes)
        return await self._get_public_url(object_key) or ""

    async def _synthesize(self, text: str) -> bytes:
        url = f"{ELEVENLABS_API_BASE}/text-to-speech/{VOICE_ID}"
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                headers={
                    "xi-api-key": self._elevenlabs_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
            resp.raise_for_status()
            return resp.content

    async def _upload(self, object_key: str, data: bytes) -> None:
        url = f"{self._sb_url}/storage/v1/object/{STORAGE_BUCKET}/{object_key}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self._sb_service_key}",
                    "Content-Type": "audio/mpeg",
                    "x-upsert": "true",
                },
                content=data,
            )
            resp.raise_for_status()

    async def _get_public_url(self, object_key: str) -> str | None:
        url = f"{self._sb_url}/storage/v1/object/public/{STORAGE_BUCKET}/{object_key}"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.head(url)
            if resp.status_code == 200:
                return url
            return None
