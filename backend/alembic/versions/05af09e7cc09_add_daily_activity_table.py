"""add_daily_activity_table

Revision ID: 05af09e7cc09
Revises: db60872e28c0
Create Date: 2026-07-23 07:51:40.211783
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '05af09e7cc09'
down_revision: str | None = 'db60872e28c0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'daily_activity',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('activity_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'activity_date', name='uq_daily_activity_user_date'),
    )


def downgrade() -> None:
    op.drop_table('daily_activity')
