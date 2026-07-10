from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.handlers import register_exception_handlers
from app.core.limiter import limiter

settings = get_settings()

app = FastAPI(
    title="DefinAm API",
    description="Backend API for the DefinAm learning platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
@app.get("/test")
async def test_route():
    return {"message": "Direct route works"}

@app.get("/hello")
async def hello():
    return {"message": "hello world"}

# ── Exception handlers ─────────────────────────────────────────────────────
register_exception_handlers(app)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

# ── CORS & Middleware ──────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
async def ping():
    return {"message": "pong"}


# ── Routes ─────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── Debug: Print registered routes ────────────────────────────────────────
print("=== Registered Routes ===")
for route in app.routes:
    print(f"  {route}")
print("=========================")