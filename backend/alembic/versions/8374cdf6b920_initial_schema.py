"""initial_schema

Revision ID: 8374cdf6b920
Revises: 
Create Date: 2026-06-28 13:03:54.747475
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8374cdf6b920'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT name FROM pg_available_extensions WHERE name = 'vector'"))
    has_vector = result.fetchone() is not None

    try:
        from pgvector.sqlalchemy import Vector
        has_pgvector_pkg = True
    except ImportError:
        has_pgvector_pkg = False

    if has_vector and has_pgvector_pkg:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        embedding_type = Vector(1536)
    else:
        embedding_type = sa.ARRAY(sa.Float)

    # 1. Create schools table
    op.create_table(
        'schools',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('email', sa.String(length=320), unique=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('active_seats', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('username', sa.String(length=255), unique=True, nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('org_id', sa.UUID(as_uuid=False), sa.ForeignKey('schools.id', ondelete='SET NULL'), nullable=True),
        sa.Column('device_fingerprint', sa.Text(), nullable=True),
        sa.Column('force_password_change', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 3. Create access_codes table
    op.create_table(
        'access_codes',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('code', sa.String(length=20), unique=True, nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('school_id', sa.UUID(as_uuid=False), sa.ForeignKey('schools.id', ondelete='SET NULL'), nullable=True),
        sa.Column('activated_by', sa.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('device_fingerprint', sa.Text(), nullable=True),
    )

    # 4. Create processed_webhooks table
    op.create_table(
        'processed_webhooks',
        sa.Column('reference', sa.String(length=255), primary_key=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 5. Create subjects table
    op.create_table(
        'subjects',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('class_level', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 6. Create chapters table
    op.create_table(
        'chapters',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('subject_id', sa.UUID(as_uuid=False), sa.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chapter_num', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 7. Create topics table
    op.create_table(
        'topics',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('chapter_id', sa.UUID(as_uuid=False), sa.ForeignKey('chapters.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content_step1', sa.Text(), nullable=True),
        sa.Column('content_step2', sa.Text(), nullable=True),
        sa.Column('content_step3', sa.Text(), nullable=True),
        sa.Column('practice_questions', sa.JSON(), nullable=True),
        sa.Column('recall_questions', sa.JSON(), nullable=True),
        sa.Column('embedding', embedding_type, nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'approved', 'published')", name="chk_topic_status"),
    )

    # 8. Create topic_reviews table
    op.create_table(
        'topic_reviews',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('topic_id', sa.UUID(as_uuid=False), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('accuracy_score', sa.Float(), nullable=True),
        sa.Column('ease_factor', sa.Float(), nullable=False, server_default='2.5'),
        sa.Column('interval_days', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('repetitions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_reviewed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('next_review_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 9. Create daily_recall_queue table
    op.create_table(
        'daily_recall_queue',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', sa.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', sa.UUID(as_uuid=False), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('rated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 10. Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', sa.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', sa.UUID(as_uuid=False), sa.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 11. Create chat_daily_usage table
    op.create_table(
        'chat_daily_usage',
        sa.Column('id', sa.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', sa.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('chat_daily_usage')
    op.drop_table('chat_messages')
    op.drop_table('daily_recall_queue')
    op.drop_table('topic_reviews')
    op.drop_table('topics')
    op.drop_table('chapters')
    op.drop_table('subjects')
    op.drop_table('processed_webhooks')
    op.drop_table('access_codes')
    op.drop_table('users')
    op.drop_table('schools')
