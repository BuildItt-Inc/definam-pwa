"""add_name_to_user

Revision ID: dad5b89483e6
Revises: 3ae9959e633d
Create Date: 2026-07-15 06:09:05.967839
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dad5b89483e6"
down_revision: str | None = "3ae9959e633d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "name")
