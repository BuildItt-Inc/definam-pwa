"""Shared text-embedding helper (Gemini gemini-embedding-001, explicitly
requested at 1536-dim to match the pgvector column). Used both at ingestion
time (embedding syllabus chunks) and at query time (embedding a topic title
to retrieve them).

Note: text-embedding-004 and embedding-001 were both discontinued by
Google — gemini-embedding-001 is the current model as of this writing.
Its native output is 3072-dim, so we request a reduced dimensionality via
EmbedContentConfig instead of padding/truncating a smaller native size.
"""

from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_EMBEDDING_MODEL = "gemini-embedding-001"
_EMBEDDING_DIM = 1536


async def embed_text(text: str) -> list[float] | None:
    """Return an embedding vector for `text`, or None if no Gemini key is
    configured or the call fails. Callers must treat None as "grounding
    unavailable" and fall back gracefully rather than raising."""
    if not settings.gemini_api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.gemini_api_key)
        result = await client.aio.models.embed_content(
            model=_EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=_EMBEDDING_DIM),
        )
        values: list[float] = list(result.embeddings[0].values)
        # Safety net in case the API ever returns a different size than
        # requested — keeps this robust to future model changes.
        if len(values) < _EMBEDDING_DIM:
            values = values + [0.0] * (_EMBEDDING_DIM - len(values))
        elif len(values) > _EMBEDDING_DIM:
            values = values[:_EMBEDDING_DIM]
        return values
    except Exception:
        logger.exception("Embedding generation failed for text: %.80s", text)
        return None
