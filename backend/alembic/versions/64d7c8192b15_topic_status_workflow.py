"""topic status workflow

Revision ID: 64d7c8192b15
Revises: 4f7d68350858
Create Date: 2026-06-24 19:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "64d7c8192b15"
down_revision: str | None = "4f7d68350858"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Rename ef to ease_factor in topic_reviews
    op.alter_column("topic_reviews", "ef", new_column_name="ease_factor")

    # Add Check constraint to topics.status
    op.create_check_constraint(
        "chk_topic_status", "topics", "status IN ('draft', 'approved', 'published')"
    )

    # Set server_default for topics.status
    op.alter_column("topics", "status", server_default="draft")


def downgrade() -> None:
    # Remove server_default for topics.status
    op.alter_column("topics", "status", server_default=None)

    # Drop Check constraint from topics.status
    op.drop_constraint("chk_topic_status", "topics", type_="check")

    # Rename ease_factor back to ef in topic_reviews
    op.alter_column("topic_reviews", "ease_factor", new_column_name="ef")
