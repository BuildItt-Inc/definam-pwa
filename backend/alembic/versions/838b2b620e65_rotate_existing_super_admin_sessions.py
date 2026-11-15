"""rotate_existing_super_admin_sessions

Revision ID: 838b2b620e65
Revises: b8e000532cb5
Create Date: 2026-11-14 01:18:01.000000
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "838b2b620e65"
down_revision: str | None = "b8e000532cb5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Invalidate all legacy 30-day sessions for super admins by rotating their current_session_id
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        connection.execute(
            sa.text(
                "UPDATE users SET current_session_id = gen_random_uuid()::text WHERE role = 'super_admin'"
            )
        )
    else:
        users_table = sa.table(
            "users",
            sa.column("id", sa.String),
            sa.column("role", sa.String),
            sa.column("current_session_id", sa.String),
        )
        result = connection.execute(
            sa.select(users_table.c.id).where(users_table.c.role == "super_admin")
        )
        for (uid,) in result.fetchall():
            connection.execute(
                users_table.update()
                .where(users_table.c.id == uid)
                .values(current_session_id=str(uuid.uuid4()))
            )


def downgrade() -> None:
    # Security session rotation is irreversible
    pass
