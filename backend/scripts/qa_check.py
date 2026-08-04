# scripts/qa_check.py
"""Scan published topic content for quality issues before it reaches students.

Run: python scripts/qa_check.py

Currently checks for "undelimited math" — digit/operator sequences that look
like arithmetic or an equation but sit outside $...$ delimiters, so
MathContent.tsx on the frontend renders them as plain unformatted text
instead of KaTeX (see the "Algebraic Expressions" incident in
frontend/docs/WEEK10_MATH_CONTENT_RENDERING.md).

This reads straight from the Topic table, not the Redis cache — the live
JIT generation path in app/api/v1/endpoints/learning.py writes content
directly to the DB and never touches Redis, so a Redis-only check (the
previous version of this script) misses everything generated that way.
"""

import asyncio
import re

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic

# Strip real math out first (both $$...$$ and $...$), then anything left
# that still looks like a number/operator pair is a candidate for
# undelimited math. False positives are fine (e.g. "10 - 5pm" or a stray
# hyphenated range); false negatives — real arithmetic that ships unrendered
# — are the risk this is meant to catch.
_MATH_DELIM_RE = re.compile(r"\$\$.*?\$\$|\$[^$]+?\$", re.DOTALL)
# Digit-then-operator OR operator-then-digit — catches both "50 * 5" and
# "= 500x" / "= 250x / 0.5" style continuation lines (operator first,
# variable rather than a bare number on the far side).
_BARE_MATH_RE = re.compile(r"\d+\s*[+\-*/=]|[+\-*/=]\s*\d+")


def find_undelimited_math(text: str | None) -> list[str]:
    """Return snippets that look like math but sit outside $...$ delimiters."""
    if not text:
        return []
    stripped = _MATH_DELIM_RE.sub(" ", text)
    return [m.group(0) for m in _BARE_MATH_RE.finditer(stripped)]


def _check_field(label: str, text: str | None, findings: list[str]) -> None:
    for snippet in find_undelimited_math(text):
        findings.append(f"  {label}: ...{snippet}...")


async def qa():
    async with db_session() as session:
        result = await session.execute(select(Topic).where(Topic.status == "published"))
        topics = result.scalars().all()

    print(f"\nChecking {len(topics)} published topics for undelimited math...\n")

    flagged_count = 0
    for t in topics:
        findings: list[str] = []
        _check_field("step1", t.content_step1, findings)
        _check_field("step2", t.content_step2, findings)
        _check_field("step3", t.content_step3, findings)

        for i, q in enumerate(t.practice_questions or []):
            _check_field(
                f"practice_questions[{i}].question", q.get("question"), findings
            )
            for opt_key, opt_val in (q.get("options") or {}).items():
                _check_field(
                    f"practice_questions[{i}].options.{opt_key}", opt_val, findings
                )
            _check_field(
                f"practice_questions[{i}].explanation", q.get("explanation"), findings
            )

        if findings:
            flagged_count += 1
            print(f"FLAGGED: {t.title} (id={t.id})")
            for f in findings:
                print(f)
            print("-" * 60)

    if flagged_count == 0:
        print("No topics flagged.")
    else:
        print(f"\n{flagged_count}/{len(topics)} topic(s) flagged for undelimited math.")


if __name__ == "__main__":
    asyncio.run(qa())
