from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check() -> dict[str, str]:
    """Health check endpoint — returns service status."""
    return {"status": "ok"}
