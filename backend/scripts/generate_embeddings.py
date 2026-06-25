#!/usr/bin/env python3
"""
Generate embeddings for all topics using Gemini.
Run: python scripts/generate_embeddings.py
     python scripts/generate_embeddings.py --topic-id=<uuid>
"""

import argparse
import asyncio
import logging

from google import genai
from sqlalchemy import select, update

from app.core.config import get_settings
from app.db.database import db_session
from app.db.models import Topic

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()
client = genai.Client(api_key=settings.gemini_api_key)


def get_embedding(text: str) -> list[float]:
    result = client.models.embed_content(model="text-embedding-004", contents=text)
    return result.embeddings[0].values


async def process_topic(topic: Topic, session) -> bool:
    parts = [
        topic.title or "",
        topic.content_step1 or "",
        topic.content_step2 or "",
        topic.content_step3 or "",
    ]
    full_text = " ".join(parts).strip()
    if not full_text:
        logger.warning(f"Topic {topic.id} has no content. Skipping.")
        return False

    try:
        embedding = get_embedding(full_text)
    except Exception as e:
        logger.error(f"Failed to embed topic {topic.id}: {e}")
        return False

    await session.execute(
        update(Topic).where(Topic.id == topic.id).values(embedding=embedding)
    )
    await session.commit()
    logger.info(f"Updated embedding for topic {topic.id} ({topic.title})")
    return True


async def main(topic_id: str | None = None):
    async with db_session() as session:
        query = select(Topic)
        if topic_id:
            query = query.where(Topic.id == topic_id)
        result = await session.execute(query)
        topics = result.scalars().all()
        if not topics:
            logger.info("No topics found.")
            return
        for topic in topics:
            await process_topic(topic, session)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate embeddings using Gemini.")
    parser.add_argument(
        "--topic-id", type=str, help="Only generate for a specific topic ID."
    )
    args = parser.parse_args()
    asyncio.run(main(topic_id=args.topic_id))
