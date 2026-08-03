#!/usr/bin/env python3
"""
Pre-generate AI learning content (Steps 1–3) for all topics and cache in Redis.
Run: python scripts/generate_content.py
     python scripts/generate_content.py --force
     python scripts/generate_content.py --force --topic-id=<uuid>
"""

import argparse
import asyncio
import logging

from groq import Groq
from sqlalchemy import select

from app.core.config import get_settings
from app.db.database import db_session
from app.db.models import Topic
from app.services.redis_client import (
    delete_topic_cache,
    get_topic_content,
    set_topic_content,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()
groq_client = Groq(api_key=settings.groq_api_key)

# ---- Prompt templates ----
# NOTE: keep the FORMATTING RULES block in sync with the prompts in
# app/services/content_generator.py — this script and that module both feed
# MathContent.tsx on the frontend, which only renders math wrapped in $...$.
# A topic generated here without these rules ships plain, unrendered
# arithmetic to students (see WEEK10 docs for the "Algebraic Expressions"
# incident this caused).
PROMPT_STEP1 = """
You are an expert tutor. Explain the topic "{title}" in 2–3 plain sentences using simple language. No jargon.
Make sure to use a real-world example if applicable.

FORMATTING RULES (CRITICAL):
- Wrap ALL mathematical expressions and numeric equations in single dollar signs: $expression$
- Examples: $x^2 + 5x + 6 = 0$, $\\frac{{250x}}{{0.5}}$, $500x$, $\\times$, $\\div$
- Use proper LaTeX: \\frac{{a}}{{b}} for fractions, x^2 for squares, x_1 for subscripts
- Never write math operators or equations as plain text outside $ $
- Keep surrounding prose in plain English, only the math parts in $ $

Return only the explanation text.
"""

PROMPT_STEP2 = """
You are an expert tutor. Provide a step-by-step worked example of the topic "{title}" using a real-world context.
Show all steps clearly. The example should be realistic and help a student understand the concept.

FORMATTING RULES (CRITICAL):
- Each numbered step MUST be on its own paragraph separated by a BLANK LINE.
- Format steps like: Step 1: [label]\\n\\n[working]\\n\\nStep 2: ...
- Wrap ALL mathematical expressions and numeric equations in single dollar signs: $expression$
- Examples: $500x - 2000 = 0$, $x = \\frac{{2000}}{{100}} = 20$, $\\therefore$
- Use proper LaTeX: \\frac{{a}}{{b}} for fractions, \\times for multiplication, \\div for division
- Prose text stays in plain English, only the math in $ $

Return only the worked example text.
"""

PROMPT_STEP3 = """
You are an expert tutor. Generate 1 practice question on the topic "{title}" with:
- 4 options (A, B, C, D)
- The correct answer (letter)
- A brief explanation of why it's correct

FORMATTING RULES (CRITICAL):
- Wrap ALL mathematical expressions in single dollar signs: $expression$
- In the question AND options AND explanation: use LaTeX for any formula, fraction, symbol

Format your response as a JSON object with keys: question, options (array of 4 strings), correct_answer (letter), explanation.
Return only the JSON.
"""


def generate_step(topic_title: str, step: int) -> str:
    """Call Groq API to generate a specific step content."""
    if step == 1:
        prompt = PROMPT_STEP1.format(title=topic_title)
    elif step == 2:
        prompt = PROMPT_STEP2.format(title=topic_title)
    elif step == 3:
        prompt = PROMPT_STEP3.format(title=topic_title)
    else:
        raise ValueError("step must be 1, 2, or 3")

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=600,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq API error for topic '{topic_title}': {e}")
        raise


async def process_topic(topic: Topic, force: bool = False):
    """Generate and cache Steps 1–3 for a single topic."""
    if not force:
        cached = get_topic_content(topic.id)
        if cached:
            logger.info(f"Topic {topic.id} ({topic.title}) already cached. Skipping.")
            return

    logger.info(f"Generating content for topic {topic.id} ({topic.title})")

    # Perform all blocking Groq API calls OUTSIDE any DB transaction
    steps = {}
    for step_num in [1, 2, 3]:
        try:
            content = generate_step(topic.title, step_num)
            steps[f"step{step_num}"] = content
        except Exception as e:
            logger.error(
                f"Failed to generate step {step_num} for topic {topic.id}: {e}"
            )
            return  # Skip storing this topic

    # All API calls succeeded — persist to cache (Redis, no DB hold)
    set_topic_content(topic.id, steps)
    logger.info(f"Cached content for topic {topic.id} ({topic.title})")


async def main(force: bool = False, topic_id: str | None = None):
    """Main entry point."""
    # 1. Fetch topic list in a short-lived session then close it
    async with db_session() as session:
        query = select(Topic)
        if topic_id:
            query = query.where(Topic.id == topic_id)
        result = await session.execute(query)
        topics = result.scalars().all()

    if not topics:
        logger.info("No topics found.")
        return

    # 2. Process each topic (API calls + Redis writes) with no open DB connection
    for topic in topics:
        if force and topic_id:
            delete_topic_cache(topic.id)
        await process_topic(topic, force)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Pre-generate topic content and cache in Redis."
    )
    parser.add_argument(
        "--force", action="store_true", help="Force re-generation even if cached."
    )
    parser.add_argument(
        "--topic-id", type=str, help="Only generate for a specific topic ID."
    )
    args = parser.parse_args()

    asyncio.run(main(force=args.force, topic_id=args.topic_id))
