#!/usr/bin/env python3
"""
Seed test subjects, chapters, and topics into the database.
Run: python tests/seed_test_data.py
"""

import asyncio
import uuid

from app.db.database import db_session
from app.db.models import Chapter, Subject, Topic


async def seed():
    async with db_session() as session:
        # Create a test subject
        subject = Subject(id=str(uuid.uuid4()), name="Mathematics", class_level="SS2")
        session.add(subject)
        await session.flush()
        print(f"[SUCCESS] Created subject: {subject.name} (ID: {subject.id})")

        # Create a test chapter
        chapter = Chapter(
            id=str(uuid.uuid4()),
            subject_id=subject.id,
            chapter_num=1,
            title="Quadratic Equations",
        )
        session.add(chapter)
        await session.flush()
        print(f"[SUCCESS] Created chapter: {chapter.title} (ID: {chapter.id})")

        # Create test topics
        topics_data = [
            {"title": "Introduction to Quadratic Equations"},
            {"title": "Solving by Factorization"},
            {"title": "Solving by Formula Method"},
            {"title": "Word Problems with Quadratics"},
        ]

        for data in topics_data:
            topic = Topic(
                id=str(uuid.uuid4()),
                chapter_id=chapter.id,
                title=data["title"],
                status="draft",
            )
            session.add(topic)
            print(f"[SUCCESS] Created topic: {topic.title} (ID: {topic.id})")

        await session.commit()
        print(f"\n[SUCCESS] Seeded {len(topics_data)} topics successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
