"""Database access layer — all queries go through SQLAlchemy async sessions."""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import select, update

from app.db.models import AccessCode, ProcessedWebhook, School, User
from app.db.session import _get_session_factory


@asynccontextmanager
async def db_session():
    """Context manager for atomic, thread-safe database session operations."""
    factory = _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── access_codes ───────────────────────────────────────────────────────────


async def get_access_code(code: str) -> dict[str, Any] | None:
    """Return a single access-code row as a dict, or None."""
    async with db_session() as session:
        result = await session.execute(
            select(AccessCode).where(AccessCode.code == code)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "code": row.code,
            "type": row.type,
            "status": row.status,
            "school_id": row.school_id,
            "activated_by": row.activated_by,
            "device_fingerprint": row.device_fingerprint,
            "email": row.email, 
        }


async def activate_code(
    code_id: str,
    user_id: str,
    fingerprint: str | None = None,
) -> None:
    """Mark an access code as active, linking it to the activating user."""
    async with db_session() as session:
        payload: dict[str, Any] = {"status": "active", "activated_by": user_id}
        if fingerprint:
            payload["device_fingerprint"] = fingerprint
        await session.execute(
            update(AccessCode).where(AccessCode.id == code_id).values(**payload)
        )


async def revoke_and_reactivate_code(code_id: str, new_fingerprint: str) -> None:
    """Replace stored device fingerprint — revokes the previous device session."""
    async with db_session() as session:
        await session.execute(
            update(AccessCode)
            .where(AccessCode.id == code_id)
            .values(device_fingerprint=new_fingerprint)
        )


async def bulk_insert_codes(org_id: str, codes: list[str]) -> None:
    """Batch-insert org access codes (pending status)."""
    async with db_session() as session:
        rows = [
            AccessCode(
                id=str(uuid.uuid4()),
                code=c,
                school_id=org_id,
                type="org",
                status="pending",
            )
            for c in codes
        ]
        session.add_all(rows)


async def insert_individual_code(code: str, email: str) -> None:
    """Insert a single individual access code with the email it was issued to."""
    async with db_session() as session:
        session.add(
            AccessCode(
                id=str(uuid.uuid4()),
                code=code,
                school_id=None,
                type="individual",
                status="pending",
                email=email,
            )
        )


# ── users ──────────────────────────────────────────────────────────────────


async def create_student_user(
    *,
    user_id: str,
    org_id: str | None,
    role: str,
    username: str | None = None,
    password_hash: str | None = None,
    device_fingerprint: str | None = None,
    force_password_change: bool = False,
    email: str | None = None,   # <-- add this
) -> None:
    """Create a user record in PostgreSQL, optionally with email."""
    async with db_session() as session:
        session.add(
            User(
                id=user_id,
                username=username or user_id,
                password_hash=password_hash,
                role=role,
                org_id=org_id,
                device_fingerprint=device_fingerprint,
                force_password_change=force_password_change,
                email=email,   # <-- store email
            )
        )


async def get_user_by_username(username: str) -> dict[str, Any] | None:
    """Return a user row by username, or None."""
    async with db_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "username": row.username,
            "password_hash": row.password_hash,
            "role": row.role,
            "org_id": row.org_id,
            "device_fingerprint": row.device_fingerprint,
            "force_password_change": row.force_password_change,
        }


async def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    """Return a user row by primary key, or None."""
    async with db_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "username": row.username,
            "role": row.role,
            "org_id": row.org_id,
            "force_password_change": row.force_password_change,
            "name": row.name,
            "email": row.email,
        }


async def update_user_password(user_id: str, password_hash: str) -> None:
    """Replace a user's password hash."""
    async with db_session() as session:
        await session.execute(
            update(User).where(User.id == user_id).values(password_hash=password_hash)
        )


async def set_force_password_change(user_id: str, value: bool) -> None:
    """Toggle the force_password_change flag for a user."""
    async with db_session() as session:
        await session.execute(
            update(User).where(User.id == user_id).values(force_password_change=value)
        )


async def update_user_name(user_id: str, name: str) -> None:
    """Update a user's display name."""
    async with db_session() as session:
        await session.execute(
            update(User).where(User.id == user_id).values(name=name)
        )


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Return a user row by email, or None."""
    async with db_session() as session:
        from sqlalchemy import func
        result = await session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "username": row.username,
            "email": row.email,
            "name": row.name,
            "role": row.role,
            "org_id": row.org_id,
            "password_hash": row.password_hash,
            "force_password_change": row.force_password_change,
        }


async def create_password_reset_token(
    user_id: str, token_hash: str, expires_at: Any
) -> None:
    """Store a hashed password reset token."""
    from app.db.models import PasswordResetToken

    async with db_session() as session:
        session.add(
            PasswordResetToken(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
            )
        )


async def consume_password_reset_token(
    token_hash: str,
) -> dict[str, Any] | None:
    """Validate and consume a reset token. Returns user_id or None if invalid/expired/used."""
    from datetime import UTC, datetime

    from sqlalchemy import update as sa_update

    from app.db.models import PasswordResetToken

    async with db_session() as session:
        result = await session.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        )
        row = result.scalar_one_or_none()
        if row is None or row.used or row.expires_at < datetime.now(UTC):
            return None
        await session.execute(
            sa_update(PasswordResetToken)
            .where(PasswordResetToken.id == row.id)
            .values(used=True)
        )
        return {"user_id": row.user_id}




async def update_user_org_and_role(user_id: str, org_id: str | None, role: str) -> None:
    """Update a user's organization and role."""
    async with db_session() as session:
        await session.execute(
            update(User).where(User.id == user_id).values(org_id=org_id, role=role)
        )


# ── schools ────────────────────────────────────────────────────────────────


async def create_org(*, email: str, name: str, seat_count: int) -> str:
    """Insert a school row and return its generated UUID."""
    org_id = str(uuid.uuid4())
    async with db_session() as session:
        session.add(School(id=org_id, email=email, name=name, active_seats=seat_count))
    return org_id


async def get_school_by_email(email: str) -> dict[str, Any] | None:
    """Return a school row by email, or None."""
    async with db_session() as session:
        result = await session.execute(select(School).where(School.email == email))
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "email": row.email,
            "name": row.name,
            "active_seats": row.active_seats,
        }


async def update_school_seats(school_id: str, new_seat_count: int) -> None:
    """Update a school's active seat count."""
    async with db_session() as session:
        await session.execute(
            update(School)
            .where(School.id == school_id)
            .values(active_seats=new_seat_count)
        )


# ── processed_webhooks ─────────────────────────────────────────────────────


async def mark_webhook_processed(reference: str) -> None:
    """Record a Paystack reference as processed (idempotency guard)."""
    async with db_session() as session:
        session.add(ProcessedWebhook(reference=reference))


async def is_webhook_processed(reference: str) -> bool:
    """Return True if this Paystack reference has already been handled."""
    async with db_session() as session:
        result = await session.execute(
            select(ProcessedWebhook.reference).where(
                ProcessedWebhook.reference == reference
            )
        )
        return result.scalar_one_or_none() is not None


# ── learning (subjects, chapters, topics) ──────────────────────────────────


async def get_all_subjects() -> list[dict[str, Any]]:
    """Return all subjects with chapter and topic counts."""
    from sqlalchemy import func

    from app.db.models import Chapter, Subject, Topic

    async with db_session() as session:
        stmt = (
            select(
                Subject,
                func.count(func.distinct(Chapter.id)).label("chapter_count"),
                func.count(func.distinct(Topic.id)).label("topic_count"),
            )
            .outerjoin(Chapter, Subject.id == Chapter.subject_id)
            .outerjoin(Topic, Chapter.id == Topic.chapter_id)
            .group_by(Subject.id)
            .order_by(Subject.created_at)
        )
        result = await session.execute(stmt)
        
        subjects = []
        for row in result.all():
            subject_obj = row[0]
            subjects.append({
                "id": subject_obj.id,
                "name": subject_obj.name,
                "class_level": subject_obj.class_level,
                "chapter_count": row.chapter_count,
                "topic_count": row.topic_count,
                "mastery_percent": None,
            })
        return subjects


async def get_chapters_by_subject(subject_id: str) -> list[dict[str, Any]]:
    """Return all chapters for a given subject with topic counts."""
    from sqlalchemy import func

    from app.db.models import Chapter, Topic

    async with db_session() as session:
        stmt = (
            select(
                Chapter,
                func.count(Topic.id).label("topic_count")
            )
            .outerjoin(Topic, Chapter.id == Topic.chapter_id)
            .where(Chapter.subject_id == subject_id)
            .group_by(Chapter.id)
            .order_by(Chapter.chapter_num)
        )
        result = await session.execute(stmt)
        
        chapters = []
        for row in result.all():
            ch_obj = row[0]
            chapters.append({
                "id": ch_obj.id,
                "subject_id": ch_obj.subject_id,
                "chapter_num": ch_obj.chapter_num,
                "title": ch_obj.title,
                "topic_count": row.topic_count,
                "mastery_percent": None,
            })
        return chapters


async def get_topics_by_chapter(
    chapter_id: str, published_only: bool = True
) -> list[dict[str, Any]]:
    """Return topics for a given chapter."""
    from app.db.models import Topic

    async with db_session() as session:
        stmt = select(Topic).where(Topic.chapter_id == chapter_id)
        if published_only:
            stmt = stmt.where(Topic.status == "published")
        stmt = stmt.order_by(Topic.created_at)
        result = await session.execute(stmt)
        return [
            {
                "id": row.id,
                "chapter_id": row.chapter_id,
                "title": row.title,
                "status": row.status,
                "mastery_percent": None,
                "last_studied_at": None,
            }
            for row in result.scalars()
        ]


async def get_topic_by_id(
    topic_id: str, published_only: bool = True
) -> dict[str, Any] | None:
    """Return a single topic by ID."""
    from app.db.models import Topic

    async with db_session() as session:
        stmt = select(Topic).where(Topic.id == topic_id)
        if published_only:
            stmt = stmt.where(Topic.status == "published")
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return {
            "id": row.id,
            "chapter_id": row.chapter_id,
            "title": row.title,
            "content_step1": row.content_step1,
            "content_step2": row.content_step2,
            "content_step3": row.content_step3,
            "practice_questions": row.practice_questions,
            "status": row.status,
        }


async def update_topic_status(
    topic_id: str, current_status: str, new_status: str
) -> bool:
    """Update topic status if it matches current_status. Returns True if updated."""
    from sqlalchemy import update

    from app.db.models import Topic

    async with db_session() as session:
        result = await session.execute(
            update(Topic)
            .where(Topic.id == topic_id, Topic.status == current_status)
            .values(status=new_status)
        )
        return result.rowcount > 0


async def update_topic_content(
    topic_id: str,
    content_step1: str,
    content_step2: str,
    content_step3: str,
    practice_questions: list[dict],
) -> None:
    """Update educational content and practice questions for a topic."""
    from sqlalchemy import update

    from app.db.models import Topic

    async with db_session() as session:
        await session.execute(
            update(Topic)
            .where(Topic.id == topic_id)
            .values(
                content_step1=content_step1,
                content_step2=content_step2,
                content_step3=content_step3,
                practice_questions=practice_questions,
            )
        )
