"""SQLAlchemy ORM models for DefinAm."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
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


# ── Subjects ────────────────────────────────────────────────────────────────


class Subject(Base):
    """WAEC subject (e.g., Mathematics, English, Chemistry)."""

    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_level: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # SS1, SS2, SS3
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(tz=UTC)
    )

    chapters: Mapped[list[Chapter]] = relationship("Chapter", back_populates="subject")


# ── Chapters ────────────────────────────────────────────────────────────────


class Chapter(Base):
    """Chapter within a subject (e.g., Equations & Inequalities)."""

    __tablename__ = "chapters"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    subject_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
    )
    chapter_num: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(tz=UTC)
    )

    subject: Mapped[Subject] = relationship("Subject", back_populates="chapters")
    topics: Mapped[list[Topic]] = relationship("Topic", back_populates="chapter")


# ── Topics ──────────────────────────────────────────────────────────────────


class Topic(Base):
    """Individual topic with 5-step learning content."""

    __tablename__ = "topics"

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'approved', 'published')", name="chk_topic_status"
        ),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    chapter_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("chapters.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content_step1: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Simple Definition
    content_step2: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Nigerian Example
    content_step3: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Visual Breakdown
    practice_questions: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # Step 4 questions
    recall_questions: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # Daily Recall questions
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(1536), nullable=True
    )  # pgvector
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", server_default="'draft'"
    )  # draft, approved, published
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(tz=UTC)
    )

    chapter: Mapped[Chapter] = relationship("Chapter", back_populates="topics")
    reviews: Mapped[list[TopicReview]] = relationship(
        "TopicReview", back_populates="topic"
    )
    recall_queue: Mapped[list[DailyRecallQueue]] = relationship(
        "DailyRecallQueue", back_populates="topic"
    )
    chat_messages: Mapped[list[ChatMessage]] = relationship(
        "ChatMessage", back_populates="topic"
    )


# ── Topic Reviews (SM-2) ──────────────────────────────────────────────────


class TopicReview(Base):
    """SM-2 spaced repetition data per student per topic."""

    __tablename__ = "topic_reviews"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    topic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    accuracy_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-100
    ease_factor: Mapped[float] = mapped_column(
        Float, nullable=False, default=2.5
    )  # Easiness factor
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    repetitions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    next_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(tz=UTC)
    )

    topic: Mapped[Topic] = relationship("Topic", back_populates="reviews")
    user: Mapped[User] = relationship("User")


# ── Daily Recall Queue ─────────────────────────────────────────────────────


class DailyRecallQueue(Base):
    """Pre-computed recall sessions for each student."""

    __tablename__ = "daily_recall_queue"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    topic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
    )
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # 0 = pending, 1 = done
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-5
    rated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(tz=UTC)
    )

    topic: Mapped[Topic] = relationship("Topic", back_populates="recall_queue")
    user: Mapped[User] = relationship("User")


# ── Chat Messages ──────────────────────────────────────────────────────────


class ChatMessage(Base):
    """AI chat history per student per topic."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    topic_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )

    topic: Mapped[Topic | None] = relationship("Topic", back_populates="chat_messages")
    user: Mapped[User] = relationship("User")


# ── Chat Daily Usage (Rate Limiting) ──────────────────────────────────────


class ChatDailyUsage(Base):
    """Tracks daily message count per student (50/day cap)."""

    __tablename__ = "chat_daily_usage"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(tz=UTC)
    )

    user: Mapped[User] = relationship("User")
