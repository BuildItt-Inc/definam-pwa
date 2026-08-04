"""Admin-only endpoints: access code management + student drill-down."""

from __future__ import annotations

import csv
from datetime import UTC, datetime, timedelta
from io import StringIO

from fastapi import APIRouter, UploadFile
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
        return "Overdue"


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
        teacher_name = (
            (admin_user.name or admin_user.username) if admin_user else "School Admin"
        )

        # 2. Total students in this school
        total_q = select(func.count(User.id)).where(User.role == "student_org")
        if org_id:
            total_q = total_q.where(User.org_id == org_id)
        total_students = (await session.execute(total_q)).scalar() or 0

        # 3. Active this week (students with DailyActivity in last 7 days)
        week_ago = now - timedelta(days=7)
        active_q = (
            select(func.count(func.distinct(DailyActivity.user_id)))
            .join(User, DailyActivity.user_id == User.id)
            .where(
                and_(
                    User.role == "student_org",
                    DailyActivity.activity_date >= week_ago.date(),
                )
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
        class_avg_accuracy = (
            round(float(avg_accuracy), 1) if avg_accuracy is not None else 0.0
        )

        # 5. Overdue recall count (number of students with overdue items)
        overdue_q = (
            select(func.count(func.distinct(DailyRecallQueue.user_id)))
            .join(User, DailyRecallQueue.user_id == User.id)
            .where(
                and_(
                    DailyRecallQueue.completed == 0,
                    DailyRecallQueue.due_date < now,
                )
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
                func.count(
                    case((TopicReview.accuracy_score < 60, 1), else_=None)
                ).label("below_60"),
                func.count(TopicReview.id).label("total"),
                func.avg(TopicReview.ease_factor).label("avg_ef"),
            )
            .join(Topic, TopicReview.topic_id == Topic.id)
            .join(User, TopicReview.user_id == User.id)
        )
        if org_id:
            struggling_q = struggling_q.where(User.org_id == org_id)
        struggling_q = (
            struggling_q.group_by(Topic.id, Topic.title)
            .order_by(func.avg(TopicReview.accuracy_score).asc())
            .limit(1)
        )
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
        if students_list:
            student_ids = [student.id for student in students_list]

            # 1. Bulk active days
            active_days_result = await session.execute(
                select(DailyActivity.user_id, DailyActivity.activity_date).where(
                    DailyActivity.user_id.in_(student_ids)
                )
            )
            user_active_days = {}
            for user_id, act_date in active_days_result:
                user_active_days.setdefault(user_id, []).append(act_date)

            # 2. Bulk overdue recall items
            overdue_result = await session.execute(
                select(DailyRecallQueue.user_id, DailyRecallQueue.due_date)
                .where(
                    and_(
                        DailyRecallQueue.user_id.in_(student_ids),
                        DailyRecallQueue.completed == 0,
                        DailyRecallQueue.due_date < now,
                    )
                )
                .order_by(DailyRecallQueue.due_date.asc())
            )
            user_overdue_items = {}
            for user_id, due_date in overdue_result:
                user_overdue_items.setdefault(user_id, []).append(due_date)

            # 3. Bulk stats for topic reviews
            reviews_stats_result = await session.execute(
                select(
                    TopicReview.user_id,
                    func.count(TopicReview.id),
                    func.avg(TopicReview.accuracy_score),
                )
                .where(TopicReview.user_id.in_(student_ids))
                .group_by(TopicReview.user_id)
            )
            user_review_stats = {
                row[0]: {"count": row[1], "avg": row[2]} for row in reviews_stats_result
            }

            # 4. Weakest topic using window functions
            rn_col = (
                func.row_number()
                .over(
                    partition_by=TopicReview.user_id,
                    order_by=TopicReview.accuracy_score.asc(),
                )
                .label("rn")
            )

            weakest_subquery = (
                select(
                    TopicReview.user_id,
                    Topic.title.label("topic_title"),
                    TopicReview.accuracy_score.label("accuracy_score"),
                    Subject.name.label("subject_name"),
                    rn_col,
                )
                .join(Topic, TopicReview.topic_id == Topic.id)
                .join(Chapter, Topic.chapter_id == Chapter.id)
                .join(Subject, Chapter.subject_id == Subject.id)
                .where(TopicReview.user_id.in_(student_ids))
                .subquery()
            )

            weakest_result = await session.execute(
                select(
                    weakest_subquery.c.user_id,
                    weakest_subquery.c.topic_title,
                    weakest_subquery.c.accuracy_score,
                    weakest_subquery.c.subject_name,
                ).where(weakest_subquery.c.rn == 1)
            )
            user_weakest = {
                row[0]: {
                    "topic_title": row[1],
                    "accuracy_score": row[2],
                    "subject_name": row[3],
                }
                for row in weakest_result
            }

            # 5. Bulk last active
            last_act_result = await session.execute(
                select(DailyActivity.user_id, func.max(DailyActivity.activity_date))
                .where(DailyActivity.user_id.in_(student_ids))
                .group_by(DailyActivity.user_id)
            )
            user_last_active = {row[0]: row[1] for row in last_act_result}

            for student in students_list:
                # Streak
                active_days = user_active_days.get(student.id, [])
                streak = _compute_streak(active_days, now.date())

                # Overdue recall items and days
                overdue_items = user_overdue_items.get(student.id, [])
                recall_status = "on_track"
                overdue_days = 0
                if overdue_items:
                    recall_status = "overdue"
                    oldest_due = overdue_items[0]
                    delta = now - oldest_due
                    overdue_days = max(0, delta.days)
                else:
                    has_reviews = user_review_stats.get(student.id, {}).get("count", 0)
                    if has_reviews == 0:
                        recall_status = "not_started"

                # Avg accuracy
                student_avg = user_review_stats.get(student.id, {}).get("avg")
                student_avg_accuracy = (
                    round(float(student_avg), 1) if student_avg is not None else 0.0
                )

                # Weakest topic and subject
                weakest_row = user_weakest.get(student.id)
                if weakest_row:
                    weakest_topic = weakest_row["topic_title"]
                    weakest_topic_accuracy = round(
                        float(weakest_row["accuracy_score"] or 0.0), 1
                    )
                    weakest_subject = weakest_row["subject_name"]
                else:
                    weakest_topic = "None"
                    weakest_topic_accuracy = 0.0
                    weakest_subject = "None"

                # Last active
                last_act_date = user_last_active.get(student.id)
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

                students_data.append(
                    {
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
                    }
                )

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
        avg_accuracy = (
            round(float(avg_accuracy), 1) if avg_accuracy is not None else 0.0
        )

        # Overdue recall count (incomplete items past due date)
        overdue_q = (
            select(func.count(DailyRecallQueue.id))
            .join(User, DailyRecallQueue.user_id == User.id)
            .where(
                and_(
                    DailyRecallQueue.completed == 0,
                    DailyRecallQueue.due_date < now,
                )
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
            func.sum(case((AccessCode.status == "active", 1), else_=0)).label(
                "activated"
            ),
            func.sum(
                case((AccessCode.status.in_(["pending", "revoked"]), 1), else_=0)
            ).label("unused"),
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
            raise NotFoundError(
                "Code not found or you do not have permission to revoke it."
            )
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
                "overdue": bool(review.next_review_at and review.next_review_at < now),
            }
            for review, title in reviews_result
        ]

        # Recall status: any pending due recall in the past?
        overdue_rows = (
            await session.execute(
                select(DailyRecallQueue.id)
                .where(
                    and_(
                        DailyRecallQueue.user_id == student_id,
                        DailyRecallQueue.completed == 0,
                        DailyRecallQueue.due_date < now,
                    )
                )
                .limit(1)
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


# ── SCR-SYL · Syllabus Ingestion ──────────────────────────────────────────


@router.post(
    "/syllabus/ingest",
    summary="Ingest a WAEC syllabus PDF",
    description=(
        "Upload a WAEC syllabus PDF for a subject. "
        "The file is chunked, embedded with Gemini, and stored in the "
        "syllabus_chunks table for RAG-grounded content generation. "
        "Re-uploading for the same subject replaces all existing chunks."
    ),
)
async def ingest_syllabus_pdf(
    _admin: AdminDep,
    file: UploadFile,
    subject_name: str | None = None,
) -> dict:
    """Accept a PDF upload and run the full chunk → embed → store pipeline."""
    import io
    import re

    import pdfplumber
    from sqlalchemy import delete as sa_delete

    from app.db.models import SyllabusChunk
    from app.services.embeddings import embed_text

    # Derive subject name from filename if not explicitly supplied
    raw_name = subject_name or (file.filename or "Unknown").removesuffix(
        ".pdf"
    ).removesuffix(".PDF")
    subj = raw_name.strip() or "Unknown"

    # Read PDF bytes in-memory (no disk I/O needed)
    pdf_bytes = await file.read()
    if not pdf_bytes:
        return {
            "subject": subj,
            "chunks_ingested": 0,
            "warning": "Uploaded file is empty.",
        }

    # Extract text from every page
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    raw_text = "\n".join(text_parts).strip()

    if not raw_text:
        return {
            "subject": subj,
            "chunks_ingested": 0,
            "warning": "No extractable text found in PDF (scanned/image PDF?).",
        }

    # Chunk at WAEC syllabus heading boundaries
    _HEADING = re.compile(
        r'^(?:\d+\.\d*\s|\d+\\?\.\s|[A-Z]\.\s)[A-Z][A-Za-z0-9 ,/&()\'"–-]{3,80}$',
        re.MULTILINE,
    )
    matches = list(_HEADING.finditer(raw_text))
    chunks: list[tuple[str, str]]
    if len(matches) < 3:
        # Heading detection didn't fire — fall back to fixed-size chunks
        size = 1500
        chunks = [
            (f"Section {i + 1}", raw_text[i : i + size])
            for i in range(0, len(raw_text), size)
        ]
    else:
        chunks = []
        for i, match in enumerate(matches):
            heading = match.group().strip()
            start = match.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
            content = raw_text[start:end].strip()
            if content:
                chunks.append((heading, content))

    # Embed each chunk
    rows: list[SyllabusChunk] = []
    skipped = 0
    for heading, content in chunks:
        embedding = await embed_text(f"{subj}: {heading}\n{content[:500]}")
        if embedding is None:
            skipped += 1
        rows.append(
            SyllabusChunk(
                subject_name=subj,
                heading=heading[:300],
                content=content,
                embedding=embedding,
            )
        )

    # Atomic replace: delete old chunks for this subject, insert new ones
    async with db_session() as session:
        await session.execute(
            sa_delete(SyllabusChunk).where(SyllabusChunk.subject_name == subj)
        )
        session.add_all(rows)

    result: dict = {"subject": subj, "chunks_ingested": len(rows)}
    if skipped:
        result["warning"] = (
            f"{skipped} chunk(s) stored without embeddings — "
            "check GEMINI_API_KEY. Re-ingest after fixing the key."
        )
    return result
