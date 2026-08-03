"""Shared text-embedding helper (Gemini text-embedding-004, 1536-dim to
match the pgvector column). Used both at ingestion time (embedding syllabus
chunks) and at query time (embedding a topic title to retrieve them).
"""

from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_EMBEDDING_MODEL = "text-embedding-004"
_EMBEDDING_DIM = 1536


async def embed_text(text: str) -> list[float] | None:
    """Return an embedding vector for `text`, or None if no Gemini key is
    configured or the call fails. Callers must treat None as "grounding
    unavailable" and fall back gracefully rather than raising."""
    if not settings.gemini_api_key:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        result = await client.aio.models.embed_content(
            model=_EMBEDDING_MODEL,
            contents=text,
        )
        values = result.embeddings[0].values
        # text-embedding-004 returns 768-dim by default; pad/truncate to
        # match the fixed Vector(1536) column if the model's native size
        # differs, so this stays robust to future model swaps.
        if len(values) < _EMBEDDING_DIM:
            values = values + [0.0] * (_EMBEDDING_DIM - len(values))
        elif len(values) > _EMBEDDING_DIM:
            values = values[:_EMBEDDING_DIM]
        return values
    except Exception:
        logger.exception("Embedding generation failed for text: %.80s", text)
        return None