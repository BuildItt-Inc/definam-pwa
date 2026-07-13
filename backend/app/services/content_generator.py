"""Service to dynamically generate learning content and questions on-demand via Gemini and Groq."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from google import genai
from groq import AsyncGroq

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize API clients based on available keys
client_gemini = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
client_groq = AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None

PROMPT_STEP1 = """
You are a Nigerian tutor. Explain the topic "{title}" in 2–3 plain sentences using simple language. No jargon.
Make sure to use a real-world Nigerian example (like market, NEPA, Jollof rice, etc.) if applicable.
Return only the explanation text. Do not include greeting or intro text.
"""

PROMPT_STEP2 = """
You are a Nigerian tutor. Provide a step-by-step worked example of the topic "{title}" using a Nigerian context.
Show all steps clearly. The example should be realistic and help a student understand the concept.
Return only the example text. Do not include greeting or intro text.
"""

PROMPT_STEP3 = """
You are a Nigerian tutor. Provide a structured visual cheat-sheet or breakdown of the topic "{title}" using ASCII diagram layout, bullet points or trees (e.g. ├── ).
Make it visually clean and highly structured.
Return only the breakdown text.
"""

PROMPT_QUESTIONS = """
You are a Nigerian tutor. Generate 2 distinct multiple choice practice questions on the topic "{title}".
The questions should use a realistic Nigerian context (e.g., shopping at Alaba market, naira transactions, cooking jollof rice).

Format your response STRICTLY as a JSON array of objects. Do not include markdown code block formatting (like ```json), just return the raw JSON array.
Each object must have the following keys:
- "type": "mcq"
- "question": The question text
- "options": An object with keys "A", "B", "C", and "D" mapping to the option strings
- "answer": The correct answer letter ("A", "B", "C", or "D")
- "explanation": A detailed explanation of why it is correct.
"""


def get_fallback_content(title: str) -> dict[str, Any]:
    """Fallback curriculum text when both Gemini and Groq API keys are missing or fail."""
    return {
        "content_step1": (
            f"{title} is a core topic in the WAEC syllabus. This lesson covers the fundamental concepts, "
            f"definitions, and formulas required to master {title} for your examinations."
        ),
        "content_step2": (
            f"In a practical Nigerian setting, think of how {title} relates to everyday activities "
            f"like trading in the market, building houses, managing energy/power supplies, or studying local environments."
        ),
        "content_step3": (
            f"Key breakdown of {title}:\n"
            f"├── 1. Primary Concept: Core definitions and structures\n"
            f"├── 2. Applications: Practical and academic uses\n"
            f"└── 3. Formula: Study the key parameters aligned with the curriculum."
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": f"Which of the following best describes the main focus of {title}?",
                "options": {
                    "A": "Basic terminology and core variables",
                    "B": "Unrelated historical stories",
                    "C": "Advanced unrelated theories",
                    "D": "None of the above",
                },
                "answer": "A",
                "explanation": f"Understanding the core definitions and terms is the starting block of mastering {title}.",
            }
        ],
    }


# ── Gemini Async Generators ────────────────────────────────────────────────

async def generate_gemini_step(prompt: str) -> str:
    """Generate a step content via Gemini."""
    if not client_gemini:
        return ""
    try:
        response = await client_gemini.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini step generation error: {e}")
        return ""


async def generate_gemini_questions(prompt: str) -> list[dict[str, Any]]:
    """Generate practice questions via Gemini."""
    if not client_gemini:
        return []
    try:
        response = await client_gemini.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()

        # Strip markdown syntax if LLM returns it
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception as e:
        logger.error(f"Gemini questions generation error: {e}")
        return []


# ── Groq Async Generators ──────────────────────────────────────────────────

async def generate_groq_step(prompt: str) -> str:
    """Generate a step content via Groq."""
    if not client_groq:
        return ""
    try:
        completion = await client_groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=600,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq step generation error: {e}")
        return ""


async def generate_groq_questions(prompt: str) -> list[dict[str, Any]]:
    """Generate practice questions via Groq."""
    if not client_groq:
        return []
    try:
        completion = await client_groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )
        text = completion.choices[0].message.content.strip()

        # Strip markdown syntax if LLM returns it
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception as e:
        logger.error(f"Groq questions generation error: {e}")
        return []


# ── Core Router ────────────────────────────────────────────────────────────

async def generate_all_topic_content(title: str) -> dict[str, Any]:
    """Concurrently generate steps 1-3 and practice questions for a topic.

    Tries Gemini first, then falls back to Groq, then falls back to static template.
    """
    step1_p = PROMPT_STEP1.format(title=title)
    step2_p = PROMPT_STEP2.format(title=title)
    step3_p = PROMPT_STEP3.format(title=title)
    questions_p = PROMPT_QUESTIONS.format(title=title)

    # 1. Try Gemini
    if client_gemini:
        logger.info(f"Generating content for '{title}' via Gemini...")
        step1, step2, step3, questions = await asyncio.gather(
            generate_gemini_step(step1_p),
            generate_gemini_step(step2_p),
            generate_gemini_step(step3_p),
            generate_gemini_questions(questions_p),
        )
        if step1 and step2 and step3:
            return {
                "content_step1": step1,
                "content_step2": step2,
                "content_step3": step3,
                "practice_questions": questions or get_fallback_content(title)["practice_questions"],
            }

    # 2. Try Groq (Fallback)
    if client_groq:
        logger.info(f"Generating content for '{title}' via Groq...")
        step1, step2, step3, questions = await asyncio.gather(
            generate_groq_step(step1_p),
            generate_groq_step(step2_p),
            generate_groq_step(step3_p),
            generate_groq_questions(questions_p),
        )
        if step1 and step2 and step3:
            return {
                "content_step1": step1,
                "content_step2": step2,
                "content_step3": step3,
                "practice_questions": questions or get_fallback_content(title)["practice_questions"],
            }

    # 3. Static fallback
    logger.warning(f"No API key available or API calls failed. Using fallback template for '{title}'.")
    return get_fallback_content(title)
