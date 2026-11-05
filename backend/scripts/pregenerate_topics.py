#!/usr/bin/env python3
"""
Pre-generate stored content (Steps 1-3, practice questions, and recall questions)
for topics in PostgreSQL using generate_all_topic_content.

Usage:
    python -m scripts.pregenerate_topics [--subject <name>] [--limit <n>] [--force] [--sleep <seconds>]
"""

import argparse
import asyncio
import logging

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Chapter, Subject, Topic
from app.services.content_generator import generate_all_topic_content
from app.services.redis_client import delete_topic_cache

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


async def pregenerate_topics(
    subject_filter: str | None = None,
    limit: int | None = None,
    force: bool = False,
    sleep_between: float = 1.0,
):
    async with db_session() as session:
        query = (
            select(Topic, Subject.name.label("subject_name"))
            .join(Chapter, Topic.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
        )

        if subject_filter:
            query = query.where(Subject.name.ilike(f"%{subject_filter}%"))

        if not force:
            # Only process topics missing step1 or recall_questions
            query = query.where(
                (Topic.content_step1.is_(None)) | (Topic.recall_questions.is_(None))
            )

        query = query.order_by(Subject.name, Topic.title)
        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        topics_to_process = result.all()

    total = len(topics_to_process)
    logger.info("Found %d topics to generate/update.", total)
    if total == 0:
        logger.info(
            "All selected topics already have complete content. Use --force to regenerate."
        )
        return

    success_count = 0
    fail_count = 0

    for idx, (topic, subject_name) in enumerate(topics_to_process, start=1):
        logger.info(
            "[%d/%d] Generating: %s (%s) [ID: %s]...",
            idx,
            total,
            topic.title,
            subject_name,
            topic.id,
        )
        try:
            generated = await generate_all_topic_content(
                title=topic.title,
                subject_name=subject_name,
            )

            async with db_session() as session:
                t_res = await session.execute(select(Topic).where(Topic.id == topic.id))
                db_topic = t_res.scalar_one_or_none()
                if db_topic:
                    db_topic.content_step1 = generated.get("content_step1")
                    db_topic.content_step2 = generated.get("content_step2")
                    db_topic.content_step3 = generated.get("content_step3")
                    db_topic.practice_questions = generated.get("practice_questions")
                    db_topic.recall_questions = generated.get("recall_questions")
                    db_topic.status = "published"
                    await session.commit()

            # Evict from Redis so fresh DB content is loaded
            delete_topic_cache(topic.id)
            success_count += 1
            logger.info("✓ [%d/%d] Success for '%s'", idx, total, topic.title)

        except Exception as exc:
            fail_count += 1
            logger.error("✗ [%d/%d] Failed for '%s': %s", idx, total, topic.title, exc)

        if sleep_between > 0 and idx < total:
            await asyncio.sleep(sleep_between)

    logger.info(
        "Finished pre-generation: %d succeeded, %d failed out of %d.",
        success_count,
        fail_count,
        total,
    )


def main():
    parser = argparse.ArgumentParser(description="Pre-generate content for topics.")
    parser.add_argument("--subject", help="Filter by subject name (e.g. Mathematics)")
    parser.add_argument("--limit", type=int, help="Limit number of topics to process")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even if topic already has content",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.5,
        help="Seconds to sleep between calls to avoid rate limits (default: 0.5)",
    )

    args = parser.parse_args()
    asyncio.run(
        pregenerate_topics(
            subject_filter=args.subject,
            limit=args.limit,
            force=args.force,
            sleep_between=args.sleep,
        )
    )


if __name__ == "__main__":
    main()
