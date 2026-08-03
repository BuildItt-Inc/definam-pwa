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
You are a friendly tutor writing for secondary school students.
Explain the topic "{title}" in 2–3 short paragraphs (not one long block).
Use a relatable real-world example where natural.
{context}
FORMATTING RULES (CRITICAL):
- Separate each paragraph with a BLANK LINE (two newlines).
- Wrap ALL mathematical expressions in single dollar signs: $expression$
- Examples: $x^2 + 5x + 6 = 0$, $\\frac{{250x}}{{0.5}}$, $500x$, $\\times$, $\\div$
- Use proper LaTeX: \\frac{{a}}{{b}} for fractions, x^2 for squares, x_1 for subscripts
- Never write math operators as plain text inside an expression
- Keep surrounding prose in plain English, only the math parts in $ $

Return only the explanation text. No greeting or intro.
"""

PROMPT_STEP2 = """
You are a friendly tutor writing for secondary school students.
Provide a clear, numbered step-by-step worked example of "{title}" set in a practical real-world context.
{context}
FORMATTING RULES (CRITICAL):
- Each numbered step MUST be on its own paragraph separated by a BLANK LINE.
- Format steps like: Step 1: [label]\n\n[working]\n\nStep 2: ...
- Wrap ALL mathematical expressions in single dollar signs: $expression$
- Examples: $500x - 2000 = 0$, $x = \\frac{{2000}}{{100}} = 20$, $\\therefore$
- Use proper LaTeX: \\frac{{a}}{{b}} for fractions, \\times for multiplication, \\div for division
- Prose text stays in plain English, only the math in $ $

Return only the worked example text. No greeting or intro.
"""

PROMPT_STEP3 = """
You are a friendly tutor writing for secondary school students.
Create a clean visual summary / cheat-sheet of "{title}" using:
- Bullet points with •
- Tree-style indentation with ├── and └──
- Clearly labelled sections
{context}
FORMATTING RULES (CRITICAL):
- Wrap ALL mathematical expressions in single dollar signs: $expression$
- Examples: $ax^2 + bx + c = 0$, $x = \\frac{{-b \\pm \\sqrt{{b^2 - 4ac}}}}{{2a}}$
- Use proper LaTeX inside $: \\frac, \\sqrt, \\pm, \\times, \\leq, \\geq, etc.
- Keep labels and headings in plain text

Return only the breakdown text. No intro.
"""

PROMPT_QUESTIONS = """
You are an expert tutor. Generate 2 distinct multiple choice practice questions on "{title}".
Use a realistic real-world context.
{context}
FORMATTING RULES (CRITICAL):
- Wrap ALL mathematical expressions in single dollar signs: $expression$
- In questions AND options AND explanations: use LaTeX for any formula, fraction, symbol
- Examples: $\\frac{{x}}{{2}} + 3 = 7$, $x = 5$, $100x - 2000 = 0$

Respond STRICTLY as a raw JSON array (no markdown fences). Each object:
- "type": "mcq"
- "question": question text (with $math$ where needed)
- "options": {{"A": ..., "B": ..., "C": ..., "D": ...}} (with $math$ where needed)
- "answer": correct letter
- "explanation": detailed explanation (with $math$ where needed)
"""

PROMPT_RECALL = """
You are an expert tutor. Write ONE spaced-repetition recall question for the topic "{title}".
This is for a student reviewing material they've already learned — it should test recall of a
core fact or concept, answerable in one or two sentences.
{context}
FORMATTING RULES (CRITICAL):
- Wrap ALL mathematical expressions in single dollar signs: $expression$

Respond STRICTLY as a raw JSON object (no markdown fences, no array):
{{"question": "...", "model_answer": "..."}}
"""


# Always safe to leave alone: these can only be genuine JSON escapes here.
_UNAMBIGUOUS_ESCAPES = set('"\\/u')
# Ambiguous: valid single-char JSON escapes (form-feed, newline, CR, tab,
# backspace) that are *also* the first letter of common LaTeX macro names
# (\frac, \neq/\nabla, \rightarrow, \times/\tan/\text, \boxed/\beta/\bar).
_AMBIGUOUS_ESCAPES = set("bfnrt")


def _sanitize_json_escapes(text: str) -> str:
    """Repair backslashes the model left un-doubled for LaTeX inside JSON.

    The prompts ask the model to embed LaTeX (\\frac, \\times, \\rightarrow,
    \\ce, ...) inside JSON string values, which is only valid JSON if the
    backslash itself is doubled (\\\\frac). Models routinely emit a single
    backslash instead. Two distinct failure modes follow:

    - Escapes like \\c (\\ce), \\s (\\sqrt), \\l (\\left) aren't valid JSON
      escapes at all, so json.loads raises "Invalid \\escape" and the whole
      response is discarded in favour of generic fallback content.
    - Escapes like \\f, \\n, \\r, \\t, \\b ARE valid single-char JSON
      escapes (form-feed, newline, CR, tab, backspace), so json.loads
      doesn't raise — it silently swaps in a control character and drops
      the rest of the macro name (e.g. "\\frac{500}{n}" quietly becomes a
      form-feed followed by "rac{500}{n}", rendered as "rac{500}{n}").

    The first case is unambiguous — every such backslash needs doubling.
    The second is ambiguous: \\n legitimately means "newline" when used to
    break up an explanation into lines (seen often in real generations).
    Disambiguate by lookahead: a genuine control-char escape is followed by
    ordinary prose (rarely a lowercase letter continuing a word — English
    sentences after a newline/tab conventionally start capitalised, and a
    real form-feed/backspace/CR is never intentional in this content),
    while a truncated LaTeX macro is followed by more lowercase letters of
    the command name. So only double the ambiguous escapes when the next
    character continues a lowercase word.
    """
    result = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "\\" and i + 1 < n:
            nxt = text[i + 1]
            if nxt in _UNAMBIGUOUS_ESCAPES:
                result.append(ch)
                result.append(nxt)
                i += 2
                continue
            if nxt in _AMBIGUOUS_ESCAPES:
                looks_like_macro = i + 2 < n and text[i + 2].isalpha() and text[i + 2].islower()
                if not looks_like_macro:
                    result.append(ch)
                    result.append(nxt)
                    i += 2
                    continue
            # Invalid JSON escape, or an ambiguous one that looks like a
            # truncated LaTeX macro — double the backslash to repair it.
            result.append("\\\\")
            result.append(nxt)
            i += 2
            continue
        result.append(ch)
        i += 1
    return "".join(result)


def get_fallback_content(title: str) -> dict[str, Any]:
    """Fallback curriculum text when both Gemini and Groq API keys are missing or fail."""
    return {
        "content_step1": (
            f"{title} is a core topic in the curriculum. This lesson covers the fundamental concepts, "
            f"definitions, and formulas required to master {title} for your examinations."
        ),
        "content_step2": (
            f"In a practical setting, think of how {title} relates to everyday activities "
            f"like commerce, construction, resource management, or science."
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
        "recall_questions": {
            "question": f"In your own words, what is {title}?",
            "model_answer": (
                f"{title} covers the core definitions, concepts, and applications required by the "
                f"curriculum — review your notes for the specific details."
            ),
        },
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

        parsed = json.loads(_sanitize_json_escapes(text))
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
            # 2 MCQs with full explanations routinely need
            # more than 1000 tokens; a tight cap truncates mid-JSON-string
            # ("Unterminated string"), which silently falls back to generic
            # content just like the escape-corruption bug above.
            max_tokens=2000,
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

        parsed = json.loads(_sanitize_json_escapes(text))
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception as e:
        logger.error(f"Groq questions generation error: {e}")
        return []


async def generate_gemini_recall(prompt: str) -> dict[str, Any] | None:
    """Generate a single recall question + model_answer pair via Gemini."""
    if not client_gemini:
        return None
    try:
        response = await client_gemini.aio.models.generate_content(
            model="gemini-2.5-flash",
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
        parsed = json.loads(_sanitize_json_escapes(text))
        if isinstance(parsed, dict) and "question" in parsed and "model_answer" in parsed:
            return parsed
        return None
    except Exception as e:
        logger.error(f"Gemini recall generation error: {e}")
        return None


async def generate_groq_recall(prompt: str) -> dict[str, Any] | None:
    """Generate a single recall question + model_answer pair via Groq."""
    if not client_groq:
        return None
    try:
        completion = await client_groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        text = completion.choices[0].message.content.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        parsed = json.loads(_sanitize_json_escapes(text))
        if isinstance(parsed, dict) and "question" in parsed and "model_answer" in parsed:
            return parsed
        return None
    except Exception as e:
        logger.error(f"Groq recall generation error: {e}")
        return None


# ── Core Router ────────────────────────────────────────────────────────────

async def generate_all_topic_content(title: str, subject_name: str | None = None) -> dict[str, Any]:
    """Concurrently generate steps 1-3, practice questions, and a recall
    question for a topic.

    If `subject_name` is given, pulls the most relevant WAEC syllabus text
    for grounding via RAG (see app.services.rag.get_syllabus_context) so
    generation is scoped to the real examinable content rather than the
    model's general knowledge. Falls back to ungrounded generation if no
    syllabus material has been ingested yet for that subject.

    Tries Gemini first, then falls back to Groq, then falls back to static template.
    """
    syllabus_context = ""
    if subject_name:
        try:
            from app.services.rag import get_syllabus_context
            syllabus_context = await get_syllabus_context(subject_name, title)
        except Exception:
            logger.exception("Syllabus context retrieval failed for '%s' / '%s'", subject_name, title)

    context_block = (
        f"\nGround your answer in this official WAEC syllabus excerpt — stay within its scope:\n"
        f"---\n{syllabus_context}\n---\n"
        if syllabus_context else ""
    )

    step1_p = PROMPT_STEP1.format(title=title, context=context_block)
    step2_p = PROMPT_STEP2.format(title=title, context=context_block)
    step3_p = PROMPT_STEP3.format(title=title, context=context_block)
    questions_p = PROMPT_QUESTIONS.format(title=title, context=context_block)
    recall_p = PROMPT_RECALL.format(title=title, context=context_block)
    # 1. Try Gemini
    if client_gemini:
        logger.info(f"Generating content for '{title}' via Gemini...")
        step1, step2, step3, questions, recall = await asyncio.gather(
            generate_gemini_step(step1_p),
            generate_gemini_step(step2_p),
            generate_gemini_step(step3_p),
            generate_gemini_questions(questions_p),
            generate_gemini_recall(recall_p),
        )
        if step1 and step2 and step3:
            return {
                "content_step1": step1,
                "content_step2": step2,
                "content_step3": step3,
                "practice_questions": questions or get_fallback_content(title)["practice_questions"],
                "recall_questions": recall or get_fallback_content(title)["recall_questions"],
            }

    # 2. Try Groq (Fallback)
    if client_groq:
        logger.info(f"Generating content for '{title}' via Groq...")
        step1, step2, step3, questions, recall = await asyncio.gather(
            generate_groq_step(step1_p),
            generate_groq_step(step2_p),
            generate_groq_step(step3_p),
            generate_groq_questions(questions_p),
            generate_groq_recall(recall_p),
        )
        if step1 and step2 and step3:
            return {
                "content_step1": step1,
                "content_step2": step2,
                "content_step3": step3,
                "practice_questions": questions or get_fallback_content(title)["practice_questions"],
                "recall_questions": recall or get_fallback_content(title)["recall_questions"],
            }

    # 3. Static fallback
    logger.warning(f"No API key available or API calls failed. Using fallback template for '{title}'.")
    return get_fallback_content(title)