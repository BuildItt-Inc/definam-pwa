"""SQLAlchemy ORM models for DefinAm."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ── Schools ────────────────────────────────────────────────────────────────


class School(Base):
    """An organisation (school) that purchases group seats."""

    __tablename__ = "schools"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    active_seats: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )

    users: Mapped[list[User]] = relationship("User", back_populates="school")
    access_codes: Mapped[list[AccessCode]] = relationship(
        "AccessCode", back_populates="school"
    )


# ── Users ──────────────────────────────────────────────────────────────────


class User(Base):
    """Platform user — individual student, org student, or admin."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # student_individual | student_org | admin
    org_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("schools.id", ondelete="SET NULL"),
        nullable=True,
    )
    device_fingerprint: Mapped[str | None] = mapped_column(Text, nullable=True)
    force_password_change: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )

    school: Mapped[School | None] = relationship("School", back_populates="users")


# ── Access Codes ───────────────────────────────────────────────────────────


class AccessCode(Base):
    """Individual or org access code used during registration."""

    __tablename__ = "access_codes"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # individual | org
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | active | revoked
    school_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("schools.id", ondelete="SET NULL"),
        nullable=True,
    )
    activated_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    device_fingerprint: Mapped[str | None] = mapped_column(Text, nullable=True)

    school: Mapped[School | None] = relationship(
        "School", back_populates="access_codes"
    )


# ── Processed Webhooks ─────────────────────────────────────────────────────


class ProcessedWebhook(Base):
    """Idempotency guard — records Paystack references that have been handled."""

    __tablename__ = "processed_webhooks"

    reference: Mapped[str] = mapped_column(String(255), primary_key=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
