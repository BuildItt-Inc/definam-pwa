"""
Seed educational content (Steps 1-3 and practice questions) for all topics in the database.

Run inside the Coolify backend container:
  python scripts/seed_curriculum_content.py
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic

# ── Content Definitions ───────────────────────────────────────────────────

SPECIAL_CONTENTS = {
    "Quadratic Equations": {
        "content_step1": (
            "A quadratic equation is any equation where the highest power of the unknown is $2$. "
            "It always takes the form $ax^2 + bx + c = 0$, where $a \\neq 0$, and $b$ and $c$ are any real numbers. "
            "The variable $x$ is what you solve for. Every quadratic has at most two solutions — called the roots."
        ),
        "content_step2": (
            "A small business owner sells portable power stations. The monthly profit $P$ (in thousands of dollars) "
            "is modelled by $P = -2x^2 + 20x - 30$, where $x$ is the number of power stations sold. To find the break-even points "
            "she sets $P = 0$ and solves the quadratic. This type of problem is a common application of quadratic functions."
        ),
        "content_step3": (
            "$ax^2 + bx + c = 0$\n"
            "├── $a$ = coefficient of $x^2$ (must not be $0$)\n"
            "├── $b$ = coefficient of $x$\n"
            "├── $c$ = constant term\n"
            "└── Solve by:\n"
            "    ├── Factorisation — split into two brackets\n"
            "    ├── Completing the square — rewrite as $(x + p)^2 = q$\n"
            "    └── Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n\n"
            "The discriminant $b^2 - 4ac$ tells you how many roots exist:\n"
            "  > 0 → two real roots\n"
            "  = 0 → one repeated root\n"
            "  < 0 → no real roots"
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": "Which of the following is a quadratic equation?",
                "options": {
                    "A": "3x + 7 = 0",
                    "B": "$x^2 + 5x - 6 = 0$",
                    "C": "$x^3 - 2x = 0$",
                    "D": "2/x + 1 = 0",
                },
                "answer": "B",
                "explanation": "A quadratic equation has the highest power of the variable equal to $2$. Only option B satisfies this condition.",
            },
            {
                "type": "mcq",
                "question": "Solve: $x^2 - 5x + 6 = 0$",
                "options": {
                    "A": "$x = -2$ and $x = -3$",
                    "B": "$x = 2$ and $x = 3$",
                    "C": "$x = 1$ and $x = 6$",
                    "D": "$x = -1$ and $x = -6$",
                },
                "answer": "B",
                "explanation": "Factorising gives $(x - 2)(x - 3) = 0$. Setting each bracket to zero gives $x = 2$ or $x = 3$.",
            },
        ],
    },
    "Linear Equations": {
        "content_step1": (
            "A linear equation is an equation in which the highest power of the unknown variable is $1$. "
            "It takes the general form $ax + b = 0$, where $a \\neq 0$. The solution is a single value of the variable "
            "that makes both sides equal."
        ),
        "content_step2": (
            "A rideshare driver charges $15 per trip. Their daily expenses (fuel, vehicle depreciation, "
            "and platform fees) total $120. The daily profit is $P = 15x - 120$. Setting $P = 0$ to break even gives "
            "$15x = 120$, so $x = 8$ trips."
        ),
        "content_step3": (
            "Standard form: $ax + b = 0$\n"
            "├── $a$ = coefficient of $x$ (must not be $0$)\n"
            "├── $b$ = constant term\n"
            "└── Solution: $x = -\\frac{b}{a}$\n\n"
            "Steps to solve:\n"
            "├── 1. Expand all brackets\n"
            "├── 2. Move $x$ terms to one side, constants to the other\n"
            "└── 3. Divide by the coefficient of $x$"
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": "Solve: $5x - 3 = 2x + 9$",
                "options": {
                    "A": "$x = 2$",
                    "B": "$x = 3$",
                    "C": "$x = 4$",
                    "D": "$x = 6$",
                },
                "answer": "C",
                "explanation": "Collect terms: $3x = 12$, which gives $x = 4$.",
            }
        ],
    },
    "Simultaneous Equations": {
        "content_step1": (
            "Simultaneous equations are two or more equations containing the same unknowns that must "
            "be satisfied at the same time. The solution is the coordinate pair $(x, y)$ where they intersect."
        ),
        "content_step2": (
            "A cafe sells sandwich combos and salad combos. One group pays $42 for $2$ sandwich combos and $3$ salad combos. "
            "Another pays $26 for $1$ sandwich combo and $2$ salad combos. System: $2x + 3y = 42$ and $x + 2y = 26$. Solving gives sandwich price $x = 6$."
        ),
        "content_step3": (
            "Two equations, two unknowns:\n"
            "  $ax + by = p$  ... (1)\n"
            "  $cx + dy = q$  ... (2)\n\n"
            "Method 1 — Elimination: Multiply to match coefficients, then add/subtract.\n"
            "Method 2 — Substitution: Make one variable the subject and substitute into the other."
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": "Solve: $x + y = 10$ and $x - y = 4$",
                "options": {
                    "A": "$x = 7, y = 3$",
                    "B": "$x = 6, y = 4$",
                    "C": "$x = 8, y = 2$",
                    "D": "$x = 5, y = 5$",
                },
                "answer": "A",
                "explanation": "Adding the two equations yields $2x = 14 \\implies x = 7$. Thus $y = 3$.",
            }
        ],
    },
    "Acids & Bases": {
        "content_step1": (
            "Acids are substances that produce hydrogen ions ($H^+$) when dissolved in water, turning blue litmus paper red. "
            "Bases are substances that react with acids to form salt and water only, producing hydroxide ions ($OH^-$) in solution."
        ),
        "content_step2": (
            "When making traditional soap, an alkaline solution (like lye, containing sodium hydroxide) "
            "is mixed with oils. If the soap is too acidic or too basic, it can irritate the skin. Neutralising it is key."
        ),
        "content_step3": (
            "Properties of Acids vs Bases:\n"
            "├── Acids:\n"
            "│   ├── Sour taste (e.g., lime, lemon)\n"
            "│   ├── Turn blue litmus paper red\n"
            "│   └── pH range: 0 to 6.9\n"
            "└── Bases:\n"
            "    ├── Bitter taste & slippery feel\n"
            "    ├── Turn red litmus paper blue\n"
            "    └── pH range: 7.1 to 14"
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": "Which of the following turns red litmus paper blue?",
                "options": {
                    "A": "Lemon juice",
                    "B": "Vinegar",
                    "C": "Sodium hydroxide solution",
                    "D": "Hydrochloric acid",
                },
                "answer": "C",
                "explanation": "Sodium hydroxide is a strong base, and bases turn red litmus paper blue. The other options are acidic.",
            }
        ],
    },
    "Comprehension": {
        "content_step1": (
            "Comprehension is the ability to read, process, and fully understand the meaning of a text. "
            "In WAEC exams, it requires extracting direct facts, inferring secondary meanings, and identifying grammatical functions."
        ),
        "content_step2": (
            "Imagine reading a news article about public transit options in a major city. A comprehension question might ask: "
            "'Why did the author choose to take a train instead?' You must locate the passage sentence describing the traffic congestion to answer accurately."
        ),
        "content_step3": (
            "How to approach Comprehension passages:\n"
            "├── 1. Scan the questions first to know what to look for\n"
            "├── 2. Read the passage actively (underlining key nouns/places)\n"
            "├── 3. Match questions to specific paragraphs\n"
            "└── 4. Formulate answers using your own words where requested"
        ),
        "practice_questions": [
            {
                "type": "mcq",
                "question": "What is the primary rule for answering comprehension questions in WAEC?",
                "options": {
                    "A": "Base answers strictly on the facts in the passage",
                    "B": "Guess based on general knowledge",
                    "C": "Copy the entire paragraph word-for-word",
                    "D": "Write the longest answer possible",
                },
                "answer": "A",
                "explanation": "Answers must be grounded solely in the provided text, not external knowledge or assumptions.",
            }
        ],
    },
}


def make_fallback_content(title: str) -> dict:
    """Generate default neat educational content for topics without predefined text."""
    return {
        "content_step1": (
            f"{title} is a core topic in the curriculum. This lesson covers the fundamental concepts, "
            f"definitions, and formulas required to master {title}."
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
    }


async def seed_content() -> None:
    async with db_session() as session:
        result = await session.execute(select(Topic))
        topics = result.scalars().all()

        updated_count = 0
        for topic in topics:
            # Overwrite if content is missing, or is preparing, or has plain text math without LaTeX $ signs
            has_no_latex = False
            is_mathy = any(
                x in topic.title.lower()
                for x in [
                    "equation",
                    "fraction",
                    "math",
                    "decimal",
                    "algebra",
                    "indices",
                    "surds",
                ]
            )
            if (
                topic.content_step1
                and "$" not in topic.content_step1
                and (
                    is_mathy or "/" in topic.content_step1 or "=" in topic.content_step1
                )
            ):
                has_no_latex = True

            should_update = (
                not topic.content_step1
                or topic.content_step1 == "Content is being prepared."
                or has_no_latex
            )
            if not should_update:
                continue

            # Retrieve special content or fallback
            content = SPECIAL_CONTENTS.get(topic.title)
            if not content:
                content = make_fallback_content(topic.title)

            topic.content_step1 = content["content_step1"]
            topic.content_step2 = content["content_step2"]
            topic.content_step3 = content["content_step3"]
            topic.practice_questions = content["practice_questions"]

            updated_count += 1

        await session.commit()
        print(
            f"[OK] Seeded educational content for {updated_count} topics in the database."
        )


if __name__ == "__main__":
    asyncio.run(seed_content())
