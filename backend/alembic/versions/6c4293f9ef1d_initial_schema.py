"""initial_schema

Revision ID: 6c4293f9ef1d
Revises: 
Create Date: 2026-05-22 12:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '6c4293f9ef1d'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- schools ---
    op.create_table(
        'schools',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('active_seats', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # --- users ---
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('org_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('device_fingerprint', sa.Text(), nullable=True),
        sa.Column('force_password_change', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['schools.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

    # --- access_codes ---
    op.create_table(
        'access_codes',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('school_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('activated_by', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('device_fingerprint', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['activated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )

    # --- processed_webhooks ---
    op.create_table(
        'processed_webhooks',
        sa.Column('reference', sa.String(length=255), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('reference')
    )


def downgrade() -> None:
    op.drop_table('access_codes')
    op.drop_table('users')
    op.drop_table('schools')
    op.drop_table('processed_webhooks')
