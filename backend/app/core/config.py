"""Application settings – loaded from environment / .env file."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── General ──
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── Supabase / PostgreSQL ──
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pharmacoguard"

    # ── MongoDB Atlas ──
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "pharmacoguard_logs"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Groq AI ──
    GROQ_API_KEY: str = ""


settings = Settings()
