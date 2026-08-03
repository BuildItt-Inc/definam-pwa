"""Admin-only endpoints: access code management + student drill-down."""

from __future__ import annotations

import csv
from datetime import UTC, datetime, timedelta
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import and_, case, func, select, update

from app.api.deps import AdminDep
from app.api.v1.endpoints.students import _compute_streak, _get_streak_active_days
from app.core.exceptions import NotFoundError
from app.db.database import db_session
from app.db.models import (
    AccessCode,
    Chapter,
    ChatMessage,
    DailyActivity,
    DailyRecallQueue,
    School,
    Subject,
    Topic,
    TopicReview,
    User,
)

router = APIRouter(tags=["admin"])


class RevokeRequest(BaseModel):
    code_id: str


def format_next_review(dt: datetime | None, now: datetime) -> str:
    if not dt:
        return "Never"
    
    dt_date = dt.date()
    now_date = now.date()
    
    if dt_date == now_date:
        return "Today"
    elif dt_date == now_date + timedelta(days=1):
        return "Tomorrow"
    elif dt_date > now_date:
        days = (dt_date - now_date).days
        return f"In {days} days"
    else:
        return "Today" if dt_date == now_date else "Overdue"


@router.get("/dashboard")
async def get_admin_dashboard(claims: AdminDep) -> dict:
    """
    Return the dashboard data for the admin homepage.
    """
    org_id = claims.get("org_id")
    now = datetime.now(UTC)

    async with db_session() as session:
        # 1. School Info
        school_name = "Your School"
        if org_id:
            school_scalar = await session.execute(
                select(School.name).where(School.id == org_id)
            )
            school_name = school_scalar.scalar_one_or_none() or "Your School"

        admin_user = await session.get(User, claims.get("sub"))
        teacher_name = (admin_user.name or admin_user.username) if admin_user else "School Admin"

        # 2. Total students in this school
        total_q = select(func.count(User.id)).where(User.role == "student_org")
        if org_id:
            total_q = total_q.where(User.org_id == org_id)
        total_students = (await session.execute(total_q)).scalar() or 0

        # 3. Active this week (students with DailyActivity in last 7 days)
        week_ago = now - timedelta(days=7)
        active_q = select(func.count(func.distinct(DailyActivity.user_id))).join(
            User, DailyActivity.user_id == User.id
        ).where(
            and_(
                User.role == "student_org",
                DailyActivity.activity_date >= week_ago.date()
            )
        )
        if org_id:
            active_q = active_q.where(User.org_id == org_id)
        active_this_week = (await session.execute(active_q)).scalar() or 0

        # 4. Average accuracy across all TopicReviews for school students
        avg_q = select(func.avg(TopicReview.accuracy_score)).join(
            User, TopicReview.user_id == User.id
        )
        if org_id:
            avg_q = avg_q.where(User.org_id == org_id)
        avg_accuracy = (await session.execute(avg_q)).scalar()
        class_avg_accuracy = round(float(avg_accuracy), 1) if avg_accuracy is not None else 0.0

        # 5. Overdue recall count (number of students with overdue items)
        overdue_q = select(func.count(func.distinct(DailyRecallQueue.user_id))).join(
            User, DailyRecallQueue.user_id == User.id
        ).where(
            and_(
                DailyRecallQueue.completed == 0,
                DailyRecallQueue.due_date < now,
            )
        )
        if org_id:
            overdue_q = overdue_q.where(User.org_id == org_id)
        recall_overdue = (await session.execute(overdue_q)).scalar() or 0

        # 6. Distinct active subjects (topics reviewed in the last 7 days)
        subjects_q = (
            select(Subject.name)
            .distinct()
            .join(Chapter, Subject.id == Chapter.subject_id)
            .join(Topic, Chapter.id == Topic.chapter_id)
            .join(TopicReview, Topic.id == TopicReview.topic_id)
            .join(User, TopicReview.user_id == User.id)
            .where(TopicReview.last_reviewed_at >= week_ago)
        )
        if org_id:
            subjects_q = subjects_q.where(User.org_id == org_id)
        active_subjects = (await session.execute(subjects_q)).scalars().all()
        # Fallback if no active subjects to prevent empty pills
        if not active_subjects:
            all_subjects_q = select(Subject.name).distinct().limit(3)
            active_subjects = (await session.execute(all_subjects_q)).scalars().all()
        active_subjects = list(active_subjects)

        # 7. AI Alert
        struggling_q = (
            select(
                Topic.title,
                func.count(case((TopicReview.accuracy_score < 60, 1), else_=None)).label("below_60"),
                func.count(TopicReview.id).label("total"),
                func.avg(TopicReview.ease_factor).label("avg_ef")
            )
            .join(Topic, TopicReview.topic_id == Topic.id)
            .join(User, TopicReview.user_id == User.id)
        )
        if org_id:
            struggling_q = struggling_q.where(User.org_id == org_id)
        struggling_q = struggling_q.group_by(Topic.id, Topic.title).order_by(func.avg(TopicReview.accuracy_score).asc()).limit(1)
        struggling_row = (await session.execute(struggling_q)).first()
        if struggling_row and struggling_row.total > 0:
            ai_alert = {
                "topic": struggling_row.title,
                "students_below_60": int(struggling_row.below_60 or 0),
                "total_students": int(struggling_row.total),
                "ef_avg": round(float(struggling_row.avg_ef or 2.5), 1),
            }
        else:
            ai_alert = {
                "topic": "None",
                "students_below_60": 0,
                "total_students": total_students,
                "ef_avg": 2.5,
            }

        # 8. Students list
        students_query = select(User).where(User.role == "student_org")
        if org_id:
            students_query = students_query.where(User.org_id == org_id)
        students_list = (await session.execute(students_query)).scalars().all()

        students_data = []
        for student in students_list:
            # Streak
            active_days = await _get_streak_active_days(session, student.id)
            streak = _compute_streak(active_days, now.date())

            # Overdue recall items and days
            overdue_items_q = select(DailyRecallQueue.due_date).where(
                and_(
                    DailyRecallQueue.user_id == student.id,
                    DailyRecallQueue.completed == 0,
                    DailyRecallQueue.due_date < now,
                )
            ).order_by(DailyRecallQueue.due_date.asc())
            overdue_items = (await session.execute(overdue_items_q)).scalars().all()

            recall_status = "on_track"
            overdue_days = 0
            if overdue_items:
                recall_status = "overdue"
                oldest_due = overdue_items[0]
                delta = now - oldest_due
                overdue_days = max(0, delta.days)
            else:
                has_reviews_q = select(func.count(TopicReview.id)).where(TopicReview.user_id == student.id)
                has_reviews = (await session.execute(has_reviews_q)).scalar() or 0
                if has_reviews == 0:
                    recall_status = "not_started"

            # Avg accuracy
            student_avg_q = select(func.avg(TopicReview.accuracy_score)).where(TopicReview.user_id == student.id)
            student_avg = (await session.execute(student_avg_q)).scalar()
            student_avg_accuracy = round(float(student_avg), 1) if student_avg is not None else 0.0

            # Weakest topic and subject
            weakest_topic_q = (
                select(Topic.title, TopicReview.accuracy_score, Subject.name)
                .join(Topic, TopicReview.topic_id == Topic.id)
                .join(Chapter, Topic.chapter_id == Chapter.id)
                .join(Subject, Chapter.subject_id == Subject.id)
                .where(TopicReview.user_id == student.id)
                .order_by(TopicReview.accuracy_score.asc())
                .limit(1)
            )
            weakest_row = (await session.execute(weakest_topic_q)).first()
            if weakest_row:
                weakest_topic = weakest_row[0]
                weakest_topic_accuracy = round(float(weakest_row[1] or 0.0), 1)
                weakest_subject = weakest_row[2]
            else:
                weakest_topic = "None"
                weakest_topic_accuracy = 0.0
                weakest_subject = "None"

            # Last active
            last_act_q = select(DailyActivity.activity_date).where(DailyActivity.user_id == student.id).order_by(DailyActivity.activity_date.desc()).limit(1)
            last_act_date = (await session.execute(last_act_q)).scalar()
            if last_act_date:
                days_ago = (now.date() - last_act_date).days
                if days_ago == 0:
                    last_active = "Today"
                elif days_ago == 1:
                    last_active = "Yesterday"
                else:
                    last_active = f"{days_ago} days ago"
            else:
                last_active = "Never"

            students_data.append({
                "id": student.id,
                "name": student.username,
                "streak_days": streak,
                "recall_status": recall_status,
                "overdue_days": overdue_days,
                "avg_accuracy": student_avg_accuracy,
                "weakest_topic": weakest_topic,
                "weakest_topic_accuracy": weakest_topic_accuracy,
                "weakest_subject": weakest_subject,
                "last_active": last_active,
            })

    return {
        "school_name": school_name,
        "class_name": "SS2A",
        "teacher_name": teacher_name,
        "location": "Lagos",
        "total_students": int(total_students),
        "active_this_week": int(active_this_week),
        "class_avg_accuracy": class_avg_accuracy,
        "accuracy_delta": 0,
        "recall_overdue": int(recall_overdue),
        "active_subjects": active_subjects,
        "ai_alert": ai_alert,
        "students": students_data,
    }


# ── SCR-10 · Admin Stats ───────────────────────────────────────────────────


@router.get("/stats")
async def get_admin_stats(claims: AdminDep) -> dict:
    """
    Return the four headline stat cards for the admin dashboard (SCR-10).

    Fields: total_students, avg_accuracy, overdue_recall_count, active_subjects_count.
    Org admins are scoped to their own school's students.
    """
    org_id = claims.get("org_id")
    now = datetime.now(UTC)

    async with db_session() as session:
        # Total students in this school
        total_q = select(func.count(User.id)).where(User.role == "student_org")
        if org_id:
            total_q = total_q.where(User.org_id == org_id)
        total_students = (await session.execute(total_q)).scalar() or 0

        # Average accuracy across all TopicReviews for school students
        avg_q = select(func.avg(TopicReview.accuracy_score)).join(
            User, TopicReview.user_id == User.id
        )
        if org_id:
            avg_q = avg_q.where(User.org_id == org_id)
        avg_accuracy = (await session.execute(avg_q)).scalar()
        avg_accuracy = round(float(avg_accuracy), 1) if avg_accuracy is not None else 0.0

        # Overdue recall count (incomplete items past due date)
        overdue_q = select(func.count(DailyRecallQueue.id)).join(
            User, DailyRecallQueue.user_id == User.id
        ).where(
            and_(
                DailyRecallQueue.completed == 0,
                DailyRecallQueue.due_date < now,
            )
        )
        if org_id:
            overdue_q = overdue_q.where(User.org_id == org_id)
        overdue_recall_count = (await session.execute(overdue_q)).scalar() or 0

        # Distinct active subjects (topics reviewed in the last 7 days)
        from datetime import timedelta

        from app.db.models import Chapter, Subject, Topic

        week_ago = now - timedelta(days=7)
        subjects_q = (
            select(func.count(func.distinct(Subject.id)))
            .join(Chapter, Subject.id == Chapter.subject_id)
            .join(Topic, Chapter.id == Topic.chapter_id)
            .join(TopicReview, Topic.id == TopicReview.topic_id)
            .join(User, TopicReview.user_id == User.id)
            .where(TopicReview.last_reviewed_at >= week_ago)
        )
        if org_id:
            subjects_q = subjects_q.where(User.org_id == org_id)
        active_subjects_count = (await session.execute(subjects_q)).scalar() or 0

    return {
        "total_students": int(total_students),
        "avg_accuracy": avg_accuracy,
        "overdue_recall_count": int(overdue_recall_count),
        "active_subjects_count": int(active_subjects_count),
    }


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
                "next_review": format_next_review(review.next_review_at, now),
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

        # Streak: same signal as the student's own dashboard (completed
        # recall sessions + recorded topic engagement)
        active_days = await _get_streak_active_days(session, student_id)
        streak = _compute_streak(active_days, now.date())

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



