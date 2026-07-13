"""
Seed curriculum data: subjects, chapters, and topics.

Run inside the Coolify backend container:
  python - << 'SEED'
  exec(open('/app/scripts/seed_curriculum.py').read())
  SEED

Or paste the entire file contents into the interactive python - << 'EOF' prompt.
Safe to re-run — skips records that already exist.
"""

from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Chapter, Subject, Topic

# ── Curriculum definition ─────────────────────────────────────────────────

CURRICULUM = [
    {
        "name": "Mathematics",
        "class_level": "SS2",
        "chapters": [
            {
                "num": 1,
                "title": "Number & Numeration",
                "topics": [
                    "Fractions & Decimals",
                    "Indices & Surds",
                    "Logarithms",
                    "Number Bases",
                    "Standard Form & Approximation",
                ],
            },
            {
                "num": 2,
                "title": "Algebraic Processes",
                "topics": [
                    "Algebraic Expressions",
                    "Factorisation",
                    "Algebraic Fractions",
                    "Functions & Relations",
                    "Binary Operations",
                    "Polynomial Division",
                ],
            },
            {
                "num": 3,
                "title": "Equations & Inequalities",
                "topics": [
                    "Quadratic Equations",
                    "Linear Equations",
                    "Simultaneous Equations",
                    "Inequalities",
                    "Word Problems",
                ],
            },
            {
                "num": 4,
                "title": "Geometry",
                "topics": [
                    "Lines & Angles",
                    "Triangles & Congruence",
                    "Circles & Circle Theorems",
                    "Polygons & Quadrilaterals",
                    "Loci & Constructions",
                ],
            },
            {
                "num": 5,
                "title": "Statistics & Probability",
                "topics": [
                    "Data Collection & Presentation",
                    "Measures of Central Tendency",
                    "Measures of Dispersion",
                    "Probability",
                ],
            },
        ],
    },
    {
        "name": "English Language",
        "class_level": "SS2",
        "chapters": [
            {
                "num": 1,
                "title": "Comprehension & Summary",
                "topics": [
                    "Comprehension",
                    "Summary Writing",
                    "Reading for Meaning",
                ],
            },
            {
                "num": 2,
                "title": "Lexis & Structure",
                "topics": [
                    "Vocabulary in Context",
                    "Synonyms & Antonyms",
                    "Idioms & Proverbs",
                ],
            },
            {
                "num": 3,
                "title": "Grammar",
                "topics": [
                    "Parts of Speech",
                    "Tenses & Aspect",
                    "Concord",
                    "Reported Speech",
                    "Punctuation",
                ],
            },
        ],
    },
    {
        "name": "Chemistry",
        "class_level": "SS2",
        "chapters": [
            {
                "num": 1,
                "title": "Acids, Bases & Salts",
                "topics": [
                    "Acids & Bases",
                    "pH Scale",
                    "Neutralisation",
                    "Preparation of Salts",
                ],
            },
            {
                "num": 2,
                "title": "Atomic Structure",
                "topics": [
                    "Atomic Models",
                    "Electronic Configuration",
                    "Isotopes",
                ],
            },
            {
                "num": 3,
                "title": "Chemical Bonding",
                "topics": [
                    "Ionic Bonding",
                    "Covalent Bonding",
                    "Metallic Bonding",
                ],
            },
        ],
    },
    {
        "name": "Physics",
        "class_level": "SS2",
        "chapters": [
            {
                "num": 1,
                "title": "Mechanics",
                "topics": [
                    "Motion & Kinematics",
                    "Newton's Laws of Motion",
                    "Work, Energy & Power",
                    "Friction",
                ],
            },
            {
                "num": 2,
                "title": "Waves & Sound",
                "topics": [
                    "Wave Properties",
                    "Sound Waves",
                    "Light & Reflection",
                    "Refraction & Lenses",
                ],
            },
        ],
    },
    {
        "name": "Economics",
        "class_level": "SS2",
        "chapters": [
            {
                "num": 1,
                "title": "Demand & Supply",
                "topics": [
                    "Law of Demand",
                    "Law of Supply",
                    "Market Equilibrium",
                    "Elasticity",
                ],
            },
            {
                "num": 2,
                "title": "Production & Costs",
                "topics": [
                    "Factors of Production",
                    "Production Possibility Curve",
                    "Costs of Production",
                ],
            },
        ],
    },
]


async def seed() -> None:
    total_subjects = total_chapters = total_topics = 0

    async with db_session() as session:
        for sub_def in CURRICULUM:
            # ── Subject ──────────────────────────────────────────────────
            existing_sub = (
                await session.execute(
                    select(Subject).where(Subject.name == sub_def["name"])
                )
            ).scalar_one_or_none()

            if existing_sub:
                subject = existing_sub
                print(f"  [SKIP] Subject already exists: {subject.name}")
            else:
                subject = Subject(
                    id=str(uuid.uuid4()),
                    name=sub_def["name"],
                    class_level=sub_def["class_level"],
                )
                session.add(subject)
                await session.flush()
                total_subjects += 1
                print(f"  [OK]   Subject created: {subject.name}")

            for ch_def in sub_def["chapters"]:
                # ── Chapter ──────────────────────────────────────────────
                existing_ch = (
                    await session.execute(
                        select(Chapter).where(
                            Chapter.subject_id == subject.id,
                            Chapter.chapter_num == ch_def["num"],
                        )
                    )
                ).scalar_one_or_none()

                if existing_ch:
                    chapter = existing_ch
                else:
                    chapter = Chapter(
                        id=str(uuid.uuid4()),
                        subject_id=subject.id,
                        chapter_num=ch_def["num"],
                        title=ch_def["title"],
                    )
                    session.add(chapter)
                    await session.flush()
                    total_chapters += 1

                for topic_title in ch_def["topics"]:
                    # ── Topic ─────────────────────────────────────────────
                    existing_topic = (
                        await session.execute(
                            select(Topic).where(
                                Topic.chapter_id == chapter.id,
                                Topic.title == topic_title,
                            )
                        )
                    ).scalar_one_or_none()

                    if not existing_topic:
                        session.add(
                            Topic(
                                id=str(uuid.uuid4()),
                                chapter_id=chapter.id,
                                title=topic_title,
                                status="published",
                            )
                        )
                        total_topics += 1

        await session.commit()

    print(
        f"\n[DONE] Seeded {total_subjects} subjects, "
        f"{total_chapters} chapters, {total_topics} topics."
    )


asyncio.run(seed())
