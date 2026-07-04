from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic


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
        parts = [topic.title, topic.content_step1 or "", topic.content_step2 or "", topic.content_step3 or ""]
        return " ".join(parts)