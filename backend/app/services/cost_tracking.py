# app/services/cost_tracking.py
from datetime import UTC, datetime

from sqlalchemy import func, select

from app.db.database import db_session
from app.db.models import ChatMessage

# Groq llama-3.3-70b-versatile pricing (as of July 2026)
# Source: https://groq.com/pricing
INPUT_COST_PER_1K = 0.0001  # $0.0001 per 1K input tokens
OUTPUT_COST_PER_1K = 0.0002  # $0.0002 per 1K output tokens


async def get_cost_report() -> list[dict]:
    """
    Generate a cost report for all students with chat activity today.
    Returns a list of dicts with student_id, messages_today, tokens_today, estimated_cost_usd.
    """
    today = datetime.now(UTC).date()
    async with db_session() as session:
        result = await session.execute(
            select(
                ChatMessage.user_id,
                func.sum(ChatMessage.input_tokens).label("input_total"),
                func.sum(ChatMessage.output_tokens).label("output_total"),
                func.count(ChatMessage.id).label("msg_count"),
            )
            .where(func.date(ChatMessage.created_at) == today)
            .group_by(ChatMessage.user_id)
        )
        rows = result.fetchall()
        report = []
        for row in rows:
            input_tokens = row.input_total or 0
            output_tokens = row.output_total or 0
            total_tokens = input_tokens + output_tokens
            cost = (input_tokens / 1000 * INPUT_COST_PER_1K) + (
                output_tokens / 1000 * OUTPUT_COST_PER_1K
            )
            report.append(
                {
                    "student_id": row.user_id,
                    "messages_today": row.msg_count,
                    "tokens_today": total_tokens,
                    "estimated_cost_usd": round(cost, 6),
                }
            )
        return report
