"""add_unique_constraint_subject_name_class_level

Revision ID: ed0e166f16b6
Revises: 05af09e7cc09
Create Date: 2026-07-23 18:19:47.441994
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed0e166f16b6'
down_revision: str | None = '05af09e7cc09'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Guard against duplicate (name, class_level) rows already existing --
    # the app-level dedup bug this constraint is meant to prevent going
    # forward could in theory have already produced some. Fail loudly with
    # the actual offending rows rather than let CREATE UNIQUE silently
    # error out uninformatively.
    connection = op.get_bind()
    duplicates = connection.execute(
        sa.text(
            "SELECT name, class_level, COUNT(*) FROM subjects "
            "GROUP BY name, class_level HAVING COUNT(*) > 1"
        )
    ).fetchall()
    if duplicates:
        raise RuntimeError(
            f"Cannot add unique constraint: duplicate (name, class_level) "
            f"rows already exist in subjects: {duplicates}. "
            f"Resolve these manually before re-running this migration."
        )

    op.create_unique_constraint(
        "uq_subjects_name_class_level", "subjects", ["name", "class_level"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_subjects_name_class_level", "subjects", type_="unique")
