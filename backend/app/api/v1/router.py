from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, internal, learning, payments, webhooks

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(learning.router, tags=["learning"])
api_router.include_router(internal.router, prefix="/internal", tags=["internal"])
