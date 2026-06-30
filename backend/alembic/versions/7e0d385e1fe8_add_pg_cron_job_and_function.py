"""add_pg_cron_job_and_function

Revision ID: <your-revision-id>
Revises: <previous-revision>
Create Date: 2026-06-30 12:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '4f7d68350858'          # keep the one that was generated
down_revision = '8374cdf6b920'  # keep the one from the file
branch_labels = None
depends_on = None

def upgrade():
    # 1. Enable pg_cron extension (safe if already enabled)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_cron;")

    # 2. Create the stub function that will eventually refresh recall queues
    op.execute("""
    CREATE OR REPLACE FUNCTION refresh_recall_queues()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RAISE NOTICE 'refresh_recall_queues() called at %', now();
        -- TODO: Week 3 - loop through all students, compute due topics, write to Redis
    END;
    $$;
    """)

    # 3. Schedule the cron job to run daily at midnight
    op.execute("""
    SELECT cron.schedule(
        'refresh_recall_queues_job',   -- job name
        '0 0 * * *',                   -- every day at midnight
        'SELECT refresh_recall_queues();'
    );
    """)

def downgrade():
    # Remove the cron job and the function
    op.execute("SELECT cron.unschedule('refresh_recall_queues_job');")
    op.execute("DROP FUNCTION IF EXISTS refresh_recall_queues();")