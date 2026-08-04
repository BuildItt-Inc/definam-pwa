from sqlalchemy import select

from app.db.database import db_session
from app.db.models import SyllabusChunk, Topic
from app.services.embeddings import embed_text


async def get_relevant_context(topic_id: str, question: str, limit: int = 3):
    """
    Retrieve the most relevant topic content chunks using pgvector similarity.
    For now, since we have only one topic per chat, we fetch the topic's full content.
    In a more advanced RAG, you'd embed the question and search all topics.
    """
    async with db_session() as session:
        result = await session.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            return ""
        # Combine steps 1-3 into a single context string
        parts = [
            topic.title,
            topic.content_step1 or "",
            topic.content_step2 or "",
            topic.content_step3 or "",
        ]
        return " ".join(parts)


# ── Syllabus-grounded generation ────────────────────────────────────────────
# Ground AI-generated lesson content and recall questions in the actual WAEC
# syllabus text (chunked + embedded offline via scripts/ingest_syllabus.py),
# instead of generating purely from the topic title and the model's general
# knowledge. Returns "" if no embedding is available or nothing's been
# ingested for the subject yet — callers should fall back to title-only
# generation in that case rather than fail.

_SYLLABUS_TOP_K = 3
_SYLLABUS_MAX_CONTEXT_CHARS = 3000


async def get_full_subject_syllabus(subject_name: str, max_chars: int = 12000) -> str:
    """Return the concatenated syllabus text for an entire subject, in
    ingestion order (which follows the syllabus's own structure). Used for
    curriculum-structure generation, where the model needs the full breadth
    of the syllabus rather than a query-specific top-k slice.
    """
    async with db_session() as session:
        result = await session.execute(
            select(SyllabusChunk)
            .where(SyllabusChunk.subject_name == subject_name)
            .order_by(SyllabusChunk.created_at)
        )
        chunks = result.scalars().all()

    if not chunks:
        return ""

    text = "\n\n".join(f"[{c.heading}]\n{c.content}" for c in chunks)
    return text[:max_chars]


async def get_syllabus_context(subject_name: str, topic_title: str) -> str:
    """Retrieve syllabus context matching a specific topic title via pgvector similarity search."""
    query_embedding = await embed_text(f"{subject_name}: {topic_title}")
    if query_embedding is None:
        return ""

    try:
        async with db_session() as session:
            result = await session.execute(
                select(SyllabusChunk)
                .where(SyllabusChunk.subject_name == subject_name)
                .where(SyllabusChunk.embedding.is_not(None))
                .order_by(SyllabusChunk.embedding.cosine_distance(query_embedding))
                .limit(_SYLLABUS_TOP_K)
            )
            chunks = result.scalars().all()
    except Exception:
        # Fallback gracefully if pgvector is not configured/supported on the database server
        return ""

    if not chunks:
        return ""

    context = "\n\n".join(f"[{c.heading}]\n{c.content}" for c in chunks)
    return context[:_SYLLABUS_MAX_CONTEXT_CHARS]
