"""add_access_code_lifespan_and_expiration

Revision ID: a1b2c3d4e5f6
Revises: 05af09e7cc09
Create Date: 2026-08-02 20:15:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "05af09e7cc09"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "access_codes",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.add_column(
        "access_codes",
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "access_codes",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "access_codes",
        sa.Column(
            "reminder_sent", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )


def downgrade() -> None:
    op.drop_column("access_codes", "reminder_sent")
    op.drop_column("access_codes", "expires_at")
    op.drop_column("access_codes", "activated_at")
    op.drop_column("access_codes", "created_at")
