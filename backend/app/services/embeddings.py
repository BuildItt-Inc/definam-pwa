"""Shared text-embedding helper (Gemini text-embedding-004, 768-dim output
padded to match the pgvector column). Used both at ingestion time (embedding
syllabus chunks) and at query time (embedding a topic title to retrieve them).
"""

from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_EMBEDDING_MODEL = "text-embedding-004"
# text-embedding-004 natively returns 768 dimensions.
# The pgvector column is declared as Vector(1536), so we pad with zeros to
# fill the gap. All stored vectors are padded consistently, so cosine-distance
# comparisons remain valid.
_NATIVE_DIM = 768
_EMBEDDING_DIM = 1536


async def embed_text(text: str) -> list[float] | None:
    """Return an embedding vector for `text`, or None if no Gemini key is
    configured or the call fails. Callers must treat None as "grounding
    unavailable" and fall back gracefully rather than raising."""
    if not settings.gemini_api_key:
        return None

    try:
        from google import genai
        from google.genai import types as genai_types

        # text-embedding-004 lives in API version v1, not v1beta (the SDK
        # default). Forcing v1 here prevents the 404 NOT_FOUND error.
        client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=genai_types.HttpOptions(api_version="v1"),
        )
        result = await client.aio.models.embed_content(
            model=_EMBEDDING_MODEL,
            contents=text,
        )
        values: list[float] = list(result.embeddings[0].values)
        # Pad or truncate to the declared column dimension
        if len(values) < _EMBEDDING_DIM:
            values = values + [0.0] * (_EMBEDDING_DIM - len(values))
        elif len(values) > _EMBEDDING_DIM:
            values = values[:_EMBEDDING_DIM]
        return values
    except Exception:
        logger.exception("Embedding generation failed for text: %.80s", text)
        return None