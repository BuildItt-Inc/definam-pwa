"""
Automatically generate and seed a comprehensive curriculum (subjects, chapters, topics)
aligned with the WAEC syllabus.

Runs via Groq if API key is present; otherwise falls back to a hand-crafted complete
syllabus structure.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any

from google import genai
from groq import Groq
from sqlalchemy import delete as sa_delete
from sqlalchemy import select

from app.core.config import get_settings
from app.db.database import db_session
from app.db.models import Chapter, Subject, Topic

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize API clients
groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
gemini_client = (
    genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
)

# ── Fallback Curriculum Definition ────────────────────────────────────────

FALLBACK_CURRICULUM = [
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
            {
                "num": 6,
                "title": "Trigonometry",
                "topics": [
                    "Trigonometric Ratios",
                    "Angles of Elevation & Depression",
                    "Sine & Cosine Rules",
                    "Bearings & Distances",
                ],
            },
            {
                "num": 7,
                "title": "Mensuration",
                "topics": [
                    "Perimeter & Area of Plane Shapes",
                    "Surface Area & Volume of Solids",
                    "Latitude & Longitude",
                ],
            },
            {
                "num": 8,
                "title": "Calculus Basics",
                "topics": [
                    "Introduction to Differentiation",
                    "Rates of Change",
                    "Integration Basics",
                ],
            },
            {
                "num": 9,
                "title": "Matrices & Determinants",
                "topics": [
                    "Introduction to Matrices",
                    "Matrix Operations",
                    "Determinant of Matrices",
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
                    "Main Idea Extraction",
                ],
            },
            {
                "num": 2,
                "title": "Lexis & Structure",
                "topics": [
                    "Vocabulary in Context",
                    "Synonyms & Antonyms",
                    "Idioms & Proverbs",
                    "Collocations",
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
                    "Passive & Active Voice",
                ],
            },
            {
                "num": 4,
                "title": "Oral English",
                "topics": [
                    "Vowel Sounds",
                    "Consonant Sounds",
                    "Stress & Intonation",
                    "Rhymes & Homophones",
                ],
            },
            {
                "num": 5,
                "title": "Essay Writing",
                "topics": [
                    "Narrative Essays",
                    "Descriptive Essays",
                    "Argumentative Essays",
                    "Formal & Informal Letters",
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
                    "Acid-Base Titration",
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
            {
                "num": 4,
                "title": "Periodic Table",
                "topics": [
                    "History & Trends",
                    "Alkali Metals",
                    "Halogens & Noble Gases",
                ],
            },
            {
                "num": 5,
                "title": "Gas Laws",
                "topics": [
                    "Boyle's & Charles's Laws",
                    "Ideal Gas Equation",
                    "Kinetic Theory of Gases",
                ],
            },
            {
                "num": 6,
                "title": "Organic Chemistry",
                "topics": [
                    "Hydrocarbons (Alkanes, Alkenes, Alkynes)",
                    "Alcohols",
                    "Carboxylic Acids",
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
                    "Circular Motion",
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
            {
                "num": 3,
                "title": "Heat & Thermodynamics",
                "topics": [
                    "Temperature & Expansion",
                    "Heat Transfer",
                    "Specific Heat Capacity",
                ],
            },
            {
                "num": 4,
                "title": "Electricity & Magnetism",
                "topics": [
                    "Electrostatics",
                    "Ohm's Law & Circuit Components",
                    "Magnetic Fields",
                    "Electromagnetic Induction",
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
                    "Division of Labour",
                ],
            },
            {
                "num": 3,
                "title": "Market Structures",
                "topics": [
                    "Perfect Competition",
                    "Monopoly",
                    "Oligopoly & Duopoly",
                ],
            },
            {
                "num": 4,
                "title": "National Income & Trade",
                "topics": [
                    "National Income Accounting",
                    "Inflation & Deflation",
                    "International Trade Basics",
                ],
            },
        ],
    },
]

CLASS_LEVELS = ["SS1", "SS2", "SS3"]

PROMPT_TEMPLATE = """
You are an expert curriculum designer for the West African Examinations Council (WAEC).
Generate a comprehensive syllabus/curriculum for {class_level} level "{subject_name}" only.
Cover the portion of the WAEC syllabus typically taught at {class_level} specifically —
not the full three-year SS1-SS3 span, and not content that properly belongs to an earlier
or later year. Divide it into 8 to 15 chapters appropriate for that year's depth and difficulty.
{context}
Each chapter must have:
- a chapter number (starting from 1)
- a chapter title
- a list of 4 to 8 topic titles (specific, clear sub-topics)

Respond ONLY with a JSON array of chapters in this format:
[
  {{
    "num": 1,
    "title": "Chapter Title",
    "topics": ["Topic 1", "Topic 2", "Topic 3"]
  }}
]
Do not include any introductory text, markdown code blocks, or explanations. Only return the raw JSON array.
"""


def generate_subject_curriculum(
    subject_name: str, class_level: str, syllabus_context: str = ""
) -> list[dict[str, Any]] | None:
    """Call Gemini or Groq to generate a complete syllabus for a subject at a specific class level.

    If `syllabus_context` is provided (real WAEC syllabus text ingested via
    scripts/ingest_syllabus.py), the model is grounded in it so chapters and
    topics reflect the actual examinable scope rather than the model's
    general sense of what a subject "usually" covers.
    """
    context_block = (
        f"\nBase this on the following official WAEC syllabus excerpt — reflect its actual "
        f"structure and scope rather than your general knowledge of the subject:\n"
        f"---\n{syllabus_context}\n---\n"
        if syllabus_context
        else ""
    )
    prompt = PROMPT_TEMPLATE.format(
        subject_name=subject_name, class_level=class_level, context=context_block
    )

    # 1. Try Gemini
    if gemini_client:
        try:
            logger.info(
                f"Generating curriculum for {subject_name} ({class_level}) via Gemini..."
            )
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            text = response.text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()

            parsed = json.loads(text)
            if isinstance(parsed, list) and len(parsed) >= 5:
                logger.info(
                    f"Successfully generated {len(parsed)} chapters for {subject_name} ({class_level}) via Gemini."
                )
                return parsed
        except Exception as e:
            logger.error(
                f"Failed to generate curriculum via Gemini for {subject_name} ({class_level}): {e}"
            )

    # 2. Try Groq (Fallback)
    if groq_client:
        try:
            logger.info(
                f"Generating curriculum for {subject_name} ({class_level}) via Groq..."
            )
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000,
            )
            text = completion.choices[0].message.content.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()

            parsed = json.loads(text)
            if isinstance(parsed, list) and len(parsed) >= 5:
                logger.info(
                    f"Successfully generated {len(parsed)} chapters for {subject_name} ({class_level}) via Groq."
                )
                return parsed
        except Exception as e:
            logger.error(
                f"Failed to generate curriculum via Groq for {subject_name} ({class_level}): {e}"
            )

    return None


async def seed_curriculum() -> None:
    subjects = [
        "Mathematics",
        "English Language",
        "Chemistry",
        "Physics",
        "Economics",
        "Biology",
        # Add each remaining WAEC subject here once its syllabus PDF has
        # been ingested via scripts/ingest_syllabus.py — ungrounded
        # generation still works via Gemini/Groq fallback, but accuracy is
        # meaningfully better once real syllabus text is available.
    ]

    curriculum_data = []

    for sub_name in subjects:
        from app.services.rag import get_full_subject_syllabus

        syllabus_context = await get_full_subject_syllabus(sub_name)

        for class_level in CLASS_LEVELS:
            generated = generate_subject_curriculum(
                sub_name, class_level, syllabus_context
            )
            if generated:
                curriculum_data.append(
                    {
                        "name": sub_name,
                        "class_level": class_level,
                        "chapters": generated,
                    }
                )
            elif class_level == "SS2":
                # Only SS2 has a hand-authored fallback. Using it for
                # SS1/SS3 would mean mislabeled SS2 content pretending to
                # be a different year -- worse than not seeding at all.
                logger.warning(
                    f"AI generation failed for {sub_name} (SS2); using fallback predefined curriculum."
                )
                fallback_sub = next(
                    s for s in FALLBACK_CURRICULUM if s["name"] == sub_name
                )
                curriculum_data.append(fallback_sub)
            else:
                logger.warning(
                    f"AI generation failed for {sub_name} ({class_level}) and no "
                    f"hand-authored fallback exists for this level -- skipping "
                    f"{sub_name} ({class_level}) this run rather than seeding "
                    f"mislabeled or missing content."
                )

    # Database insertion
    total_subjects = total_chapters = total_topics = 0

    async with db_session() as session:
        for sub_def in curriculum_data:
            # ── Subject ──────────────────────────────────────────────────
            existing_sub = (
                await session.execute(
                    select(Subject).where(
                        Subject.name == sub_def["name"],
                        Subject.class_level == sub_def["class_level"],
                    )
                )
            ).scalar_one_or_none()

            if existing_sub:
                subject = existing_sub
                # Clean up existing topics & chapters for this subject so re-generating
                # replaces old chapters/topics instead of accumulating duplicates
                sub_chapter_ids = select(Chapter.id).where(
                    Chapter.subject_id == subject.id
                )
                await session.execute(
                    sa_delete(Topic).where(Topic.chapter_id.in_(sub_chapter_ids))
                )
                await session.execute(
                    sa_delete(Chapter).where(Chapter.subject_id == subject.id)
                )
                await session.flush()
            else:
                subject = Subject(
                    id=str(uuid.uuid4()),
                    name=sub_def["name"],
                    class_level=sub_def["class_level"],
                )
                session.add(subject)
                await session.flush()
                total_subjects += 1

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
                    # Update title if changed
                    chapter.title = ch_def["title"]
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

    logger.info(
        f"[DONE] Seeded curriculum: {total_subjects} new subjects, "
        f"{total_chapters} new chapters, {total_topics} new topics."
    )


if __name__ == "__main__":
    asyncio.run(seed_curriculum())
