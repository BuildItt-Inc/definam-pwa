"""add_super_admin_invites_and_previous_role

Revision ID: 2dbed7713fe7
Revises: 838b2b620e65
Create Date: 2026-11-15

Adds:
  - super_admin_invites table: single-use invite tokens (stored as SHA-256 hash),
    status enum, invited_by FK, previous_role snapshot for safe demotion.
  - users.previous_role column: stores the role that was active before an existing
    user was promoted to super_admin, so removal can restore it.

Deploy order: safe to run before the code that uses it (backward compatible).
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2dbed7713fe7"
down_revision: str | None = "838b2b620e65"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add previous_role to users (nullable — existing rows have no stored previous role)
    op.add_column(
        "users",
        sa.Column("previous_role", sa.String(50), nullable=True),
    )

    # 2. Create super_admin_invites
    op.create_table(
        "super_admin_invites",
        sa.Column(
            "id",
            sa.UUID(as_uuid=False),
            primary_key=True,
        ),
        sa.Column("email", sa.String(320), nullable=False),
        # SHA-256 hex of the raw token; the raw token is never stored.
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        # pending | accepted | revoked | expired (computed from expires_at for display)
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column(
            "invited_by",
            sa.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Snapshot of the invitee's role before promotion (NULL if new account).
        sa.Column("previous_role", sa.String(50), nullable=True),
        # True  → delete the account on removal.
        # False → restore previous_role and demote on removal.
        sa.Column(
            "created_via_invite",
            sa.Boolean,
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        # FK to users so we can join to get the accepted user's id.
        sa.Column(
            "accepted_by",
            sa.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_super_admin_invites_email",
        "super_admin_invites",
        ["email"],
    )
    op.create_index(
        "ix_super_admin_invites_status",
        "super_admin_invites",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_super_admin_invites_status", table_name="super_admin_invites")
    op.drop_index("ix_super_admin_invites_email", table_name="super_admin_invites")
    op.drop_table("super_admin_invites")
    op.drop_column("users", "previous_role")
