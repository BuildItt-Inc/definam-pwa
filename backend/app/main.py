from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.handlers import register_exception_handlers
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

settings = get_settings()

if not settings.cookie_secure:
    logger.warning(
        "COOKIE_SECURE is false — the refresh-token cookie is being set with "
        "SameSite=Lax, not Secure+SameSite=None. This is expected for local "
        "plain-HTTP dev. If this is a real deployment where the frontend and "
        "backend are on different origins, every user's session will be "
        "silently dropped on refresh — set COOKIE_SECURE=true."
    )

app = FastAPI(
    title="Recall API",
    description="Backend API for the Recall learning platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Exception handlers ─────────────────────────────────────────────────────
register_exception_handlers(app)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# ── CORS & Middleware ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ── Routes ─────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")
