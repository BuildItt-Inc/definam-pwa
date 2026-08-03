"""add syllabus_chunks table for RAG-grounded content generation

Revision ID: b2c3d4e5f6a7
Revises: f9a8b7c6d5e4
Create Date: 2026-08-03 00:00:00.000000
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: str | None = 'f9a8b7c6d5e4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    result = connection.execute(
        sa.text("SELECT name FROM pg_available_extensions WHERE name = 'vector'")
    )
    has_vector = result.fetchone() is not None
    try:
        from pgvector.sqlalchemy import Vector
        has_pgvector_pkg = True
    except ImportError:
        has_pgvector_pkg = False

    embedding_col = (
        Vector(1536) if (has_vector and has_pgvector_pkg) else postgresql.JSONB()
    )

    op.create_table(
        'syllabus_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('subject_name', sa.String(length=100), nullable=False),
        sa.Column('heading', sa.String(length=300), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', embedding_col, nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        'ix_syllabus_chunks_subject_name', 'syllabus_chunks', ['subject_name']
    )


def downgrade() -> None:
    op.drop_index('ix_syllabus_chunks_subject_name', table_name='syllabus_chunks')
    op.drop_table('syllabus_chunks')