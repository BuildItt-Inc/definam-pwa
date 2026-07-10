#!/usr/bin/env python3
"""
Seed pilot school subjects, chapters, and topics.
Run: python -m scripts.seed_pilot_data --file data.json
"""

import asyncio
import json
import sys
import argparse
import uuid
from sqlalchemy import select
from app.db.database import db_session
from app.db.models import Subject, Chapter, Topic

async def seed_from_json(file_path: str):
    with open(file_path, 'r') as f:
        data = json.load(f)

    async with db_session() as session:
        for subject_name, subject_data in data.items():
            # Create subject
            result = await session.execute(select(Subject).where(Subject.name == subject_name))
            subject = result.first()
            if not subject:
                subject = Subject(
                    id=str(uuid.uuid4()),
                    name=subject_name,
                    class_level=subject_data.get("class_level", "SS2")
                )
                session.add(subject)
                await session.flush()
                print(f"✅ Created subject: {subject_name}")

            for chapter_data in subject_data.get("chapters", []):
                # Create chapter
                result = await session.execute(
                    select(Chapter).where(
                        Chapter.subject_id == subject.id,
                        Chapter.chapter_num == chapter_data["num"]
                    )
                )
                chapter = result.first()
                if not chapter:
                    chapter = Chapter(
                        id=str(uuid.uuid4()),
                        subject_id=subject.id,
                        chapter_num=chapter_data["num"],
                        title=chapter_data["title"]
                    )
                    session.add(chapter)
                    await session.flush()
                    print(f"  ✅ Created chapter: {chapter_data['title']}")

                for topic_title in chapter_data.get("topics", []):
                    result = await session.execute(
                        select(Topic).where(
                            Topic.chapter_id == chapter.id,
                            Topic.title == topic_title
                        )
                    )
                    topic = result.first()
                    if not topic:
                        topic = Topic(
                            id=str(uuid.uuid4()),
                            chapter_id=chapter.id,
                            title=topic_title,
                            status="published"
                        )
                        session.add(topic)
                        print(f"    ✅ Created topic: {topic_title}")

        await session.commit()
        print("\n🎉 Pilot data seeded successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to JSON file with subject data")
    args = parser.parse_args()
    asyncio.run(seed_from_json(args.file))