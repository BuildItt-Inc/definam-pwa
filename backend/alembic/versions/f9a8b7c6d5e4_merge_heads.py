"""merge heads

Revision ID: f9a8b7c6d5e4
Revises: ed0e166f16b6, a1b2c3d4e5f6
Create Date: 2026-08-02 20:30:00.000000
"""
from __future__ import annotations

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = 'f9a8b7c6d5e4'
down_revision: str | Sequence[str] | None = ('ed0e166f16b6', 'a1b2c3d4e5f6')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
