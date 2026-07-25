from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────
    app_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    # Stored as str so pydantic-settings won't JSON-parse it before our
    # validator runs; the validator normalises it to list[str] at runtime.
    allowed_origins: str | list[str] = "http://localhost:3000"
    # Controls the refresh-token cookie's Secure/SameSite attributes (see
    # _set_refresh_cookie in auth.py). Must be explicitly set to true in any
    # real deployment where the frontend and backend are on different
    # origins (e.g. Vercel + Coolify) — SameSite=None cookies are silently
    # rejected by browsers unless Secure is also set, and without
    # SameSite=None a cross-origin refresh call never receives the cookie,
    # so every page refresh logs the user out with no visible error.
    # Defaults to false so plain-HTTP local dev keeps working out of the box.
    cookie_secure: bool = False

    # ── Redis ──────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Database ───────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # ── Auth (JWT) ─────────────────────────────────────────
    jwt_secret: str = "supersecretjwtkeythatisreallylongandsecure123"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 15  # access token — short-lived
    jwt_refresh_expire_days: int = 30  # refresh token — long-lived

    # ── Paystack ───────────────────────────────────────────
    paystack_secret_key: str = "mock_paystack_secret_key"
    paystack_webhook_secret: str = "mock_webhook_secret"

    # ── Email — Resend (primary) ───────────────────────────
    resend_api_key: str = ""
    from_email: str = "no-reply@definam.ng"

    # ── Email — SMTP (fallback) ────────────────────────────
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""

    # ── AI — Chat & content generation (Groq / Llama) ────────
    groq_api_key: str = ""

    # ── AI — Embeddings (Gemini text-embedding-004) ────────────
    gemini_api_key: str = ""

    # ── Push notifications (OneSignal) ────────────────────────
    onesignal_app_id: str = ""
    onesignal_api_key: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def normalise_database_url(cls, v: str) -> str:
        """Ensure the URL uses the postgresql+asyncpg driver.

        Coolify / Heroku / Supabase provide URLs starting with
        ``postgres://`` or ``postgresql://``.  SQLAlchemy's async engine
        requires ``postgresql+asyncpg://``.
        """
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql+psycopg2://"):
            v = v.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list[str]) -> list[str]:
        """Allow ALLOWED_ORIGINS as a comma-separated string in .env."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
