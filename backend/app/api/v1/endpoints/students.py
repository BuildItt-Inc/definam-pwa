from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import CurrentUserDep
from app.db.database import db_session

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/me/heatmap")
async def get_student_heatmap(claims: CurrentUserDep) -> list[dict]:
    """
    Return a 90-day study activity heatmap for the authenticated student.
    Includes days with 0 activity.
    """
    user_id = claims["sub"]

    query = text("""
        WITH date_series AS (
            SELECT CAST(g.date AS DATE) AS study_date
            FROM generate_series(
                CURRENT_DATE - INTERVAL '89 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS g(date)
        ),
        study_counts AS (
            SELECT CAST(study_time AS DATE) AS study_date, COUNT(DISTINCT topic_id) AS topic_count
            FROM (
                SELECT created_at AS study_time, topic_id
                FROM topic_reviews
                WHERE user_id = :user_id AND created_at IS NOT NULL
                UNION ALL
                SELECT rated_at AS study_time, topic_id
                FROM daily_recall_queue
                WHERE user_id = :user_id AND completed = 1 AND rated_at IS NOT NULL
            ) sub
            WHERE study_time >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY CAST(study_time AS DATE)
        )
        SELECT
            TO_CHAR(ds.study_date, 'YYYY-MM-DD') AS date,
            COALESCE(sc.topic_count, 0) AS count
        FROM date_series ds
        LEFT JOIN study_counts sc ON ds.study_date = sc.study_date
        ORDER BY ds.study_date ASC;
    """)

    async with db_session() as session:
        result = await session.execute(query, {"user_id": user_id})
        return [{"date": row[0], "count": row[1]} for row in result.fetchall()]
