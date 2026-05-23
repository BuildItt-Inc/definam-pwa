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


async def insert_individual_code(code: str) -> None:
    """Insert a single individual access code generated after payment."""
    async with db_session() as session:
        session.add(
            AccessCode(
                id=str(uuid.uuid4()),
                code=code,
                school_id=None,
                type="individual",
                status="pending",
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
) -> None:
    """Create a user record in PostgreSQL."""
    async with db_session() as session:
        session.add(
            User(
                id=user_id,
                username=username or user_id,  # fallback for org students
                password_hash=password_hash,
                role=role,
                org_id=org_id,
                device_fingerprint=device_fingerprint,
                force_password_change=force_password_change,
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
