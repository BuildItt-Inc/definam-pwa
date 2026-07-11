"""Admin-only endpoints: access code management + student drill-down."""

from __future__ import annotations

import csv
from datetime import UTC, date, datetime
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import and_, case, func, select, text, update
from sqlalchemy.types import Date

from app.api.deps import AdminDep
from app.core.exceptions import NotFoundError
from app.db.database import db_session
from app.db.models import (
    AccessCode,
    ChatMessage,
    DailyRecallQueue,
    School,
    Topic,
    TopicReview,
    User,
)

router = APIRouter(tags=["admin"])


class RevokeRequest(BaseModel):
    code_id: str


# ── SCR-12 · Access Codes Table ────────────────────────────────────────────


@router.get("/codes")
async def list_codes(claims: AdminDep) -> dict:
    """Return access codes + stats for the admin codes table (SCR-12)."""
    org_id = claims.get("org_id")

    async with db_session() as session:
        # Stats: count by status in one query
        stats_query = select(
            func.count().label("total"),
            func.sum(case((AccessCode.status == "active", 1), else_=0)).label("activated"),
            func.sum(case((AccessCode.status.in_(["pending", "revoked"]), 1), else_=0)).label("unused"),
        )
        if org_id:
            stats_query = stats_query.where(AccessCode.school_id == org_id)
        stats_row = (await session.execute(stats_query)).one()

        # Codes list: left-join User to get the student's username
        codes_query = (
            select(
                AccessCode.id,
                AccessCode.code,
                AccessCode.status,
                User.username.label("student_name"),
            )
            .outerjoin(User, AccessCode.activated_by == User.id)
            .order_by(AccessCode.code)
        )
        if org_id:
            codes_query = codes_query.where(AccessCode.school_id == org_id)
        codes_rows = (await session.execute(codes_query)).all()

        # School name for the subscription stub
        school_name = "Your School"
        if org_id:
            school_scalar = await session.execute(
                select(School.name).where(School.id == org_id)
            )
            school_name = school_scalar.scalar_one_or_none() or "Your School"

    total = stats_row.total or 0
    activated = int(stats_row.activated or 0)
    unused = int(stats_row.unused or 0)

    return {
        "subscription": {
            # Stubbed for MVP — no term/expiry columns in DB yet
            "school_name": school_name,
            "term": "Term 3 2026",
            "status": "active",
            "total_seats": total,
            "expires_at": "Dec 31, 2026",
        },
        "stats": {
            "total": total,
            "activated": activated,
            "unused": unused,
        },
        "codes": [
            {
                "id": row.id,
                "code": row.code,
                "student_name": row.student_name,
                "status": "active" if row.status == "active" else "unused",
                "activated_at": None,  # not tracked per-row yet — MVP stub
            }
            for row in codes_rows
        ],
    }


@router.get("/codes/download")
async def download_codes(
    claims: AdminDep,
    status: str | None = None,
) -> Response:
    """Download access codes as CSV (admin only)."""
    async with db_session() as session:
        query = select(AccessCode)
        if status:
            query = query.where(AccessCode.status == status)
        # BOLA protection: org admins can only see their own school's codes
        org_id = claims.get("org_id")
        if org_id:
            query = query.where(AccessCode.school_id == org_id)
        result = await session.execute(query)
        codes = result.scalars().all()

    with StringIO() as output:
        writer = csv.writer(output)
        writer.writerow(["code", "status", "activated_by", "device_fingerprint"])
        for c in codes:
            writer.writerow([c.code, c.status, c.activated_by, c.device_fingerprint])
        csv_data = output.getvalue()

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=access_codes.csv"},
    )


@router.post("/codes/revoke")
async def revoke_code(
    payload: RevokeRequest,
    claims: AdminDep,
) -> dict:
    """Revoke an access code (admin only)."""
    async with db_session() as session:
        stmt = update(AccessCode).where(AccessCode.id == payload.code_id)
        # BOLA protection: org admins scoped to their own school
        org_id = claims.get("org_id")
        if org_id:
            stmt = stmt.where(AccessCode.school_id == org_id)

        result = await session.execute(
            stmt.values(status="revoked").returning(AccessCode.code)
        )
        updated = result.scalar_one_or_none()
        if not updated:
            raise NotFoundError("Code not found or you do not have permission to revoke it.")
        await session.commit()
        return {"message": f"Code {updated} revoked."}


# ── SCR-11 · Student Drill-Down ────────────────────────────────────────────


@router.get("/students/{student_id}")
async def get_student_detail(student_id: str, claims: AdminDep) -> dict:
    """
    Return topic history + chat sessions for a single student (SCR-11).

    Org admins are BOLA-scoped to their own school's students only.
    """
    org_id = claims.get("org_id")
    now = datetime.now(UTC)

    async with db_session() as session:
        # Verify student exists (and belongs to this admin's school)
        student_query = select(User).where(User.id == student_id)
        if org_id:
            student_query = student_query.where(User.org_id == org_id)
        student = (await session.execute(student_query)).scalar_one_or_none()
        if not student:
            raise NotFoundError("Student not found.")

        # Topic history: TopicReview joined with Topic title
        reviews_result = await session.execute(
            select(TopicReview, Topic.title)
            .join(Topic, TopicReview.topic_id == Topic.id)
            .where(TopicReview.user_id == student_id)
            .order_by(TopicReview.last_reviewed_at.desc())
        )
        topic_history = [
            {
                "topic_id": review.topic_id,
                "topic_title": title,
                "accuracy": round(review.accuracy_score or 0.0, 1),
                "next_review": (
                    review.next_review_at.isoformat() if review.next_review_at else None
                ),
                "ease_factor": round(review.ease_factor, 2),
                "overdue": bool(
                    review.next_review_at and review.next_review_at < now
                ),
            }
            for review, title in reviews_result
        ]

        # Recall status: any pending due recall in the past?
        overdue_rows = (
            await session.execute(
                select(DailyRecallQueue.id).where(
                    and_(
                        DailyRecallQueue.user_id == student_id,
                        DailyRecallQueue.completed == 0,
                        DailyRecallQueue.due_date < now,
                    )
                ).limit(1)
            )
        ).all()
        recall_status = "overdue" if overdue_rows else "on_track"

        # Streak: consecutive calendar days with at least one completed recall
        completed_days_result = await session.execute(
            select(
                func.date_trunc("day", DailyRecallQueue.due_date)
                .cast(Date)
                .label("day")
            )
            .where(
                and_(
                    DailyRecallQueue.user_id == student_id,
                    DailyRecallQueue.completed == 1,
                )
            )
            .group_by(text("day"))
            .order_by(text("day desc"))
        )
        completed_days = [row.day for row in completed_days_result]
        streak = _compute_streak(completed_days, now.date())

        # Chat sessions: group ChatMessage rows by (topic_id, calendar-day)
        # Limit to the most recent 200 messages to avoid loading unbounded history
        msgs_result = await session.execute(
            select(ChatMessage, Topic.title.label("topic_title"))
            .outerjoin(Topic, ChatMessage.topic_id == Topic.id)
            .where(ChatMessage.user_id == student_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(200)
        )
        messages = list(msgs_result)
        messages.reverse()  # Process chronologically

        sessions_map: dict[tuple, dict] = {}
        for msg, topic_title in messages:
            day_key = msg.created_at.date().isoformat()
            session_key = (msg.topic_id or "general", day_key)
            if session_key not in sessions_map:
                sessions_map[session_key] = {
                    "id": f"{msg.topic_id or 'general'}-{day_key}",
                    "date": day_key,
                    "subject": "General",
                    "topic": topic_title or "General",
                    "message_count": 0,
                    "preview_messages": [],
                }
            entry = sessions_map[session_key]
            entry["message_count"] += 1
            if len(entry["preview_messages"]) < 2:
                entry["preview_messages"].append(
                    {
                        "role": "ai" if msg.role == "assistant" else "student",
                        "content": msg.content,
                    }
                )

        chat_sessions = sorted(
            sessions_map.values(), key=lambda s: s["date"], reverse=True
        )[:20]  # cap at 20 for MVP

    return {
        "id": student.id,
        "name": student.username,
        "streak_days": streak,
        "recall_status": recall_status,
        "topic_history": topic_history,
        "chat_sessions": chat_sessions,
    }


def _compute_streak(days_desc: list, today: date) -> int:
    """Count consecutive calendar days (desc-ordered) ending today or yesterday."""
    from datetime import timedelta

    if not days_desc:
        return 0

    streak = 0
    expected = today

    for d in days_desc:
        if d == expected:
            streak += 1
            expected = d - timedelta(days=1)
        elif streak == 0 and d == today - timedelta(days=1):
            # Streak may start from yesterday if student hasn't done today yet
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break

    return streak

