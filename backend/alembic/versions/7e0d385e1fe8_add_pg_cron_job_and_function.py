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

    # 2. Create the full refresh_recall_queues() function with all fixes
    op.execute("""
    CREATE OR REPLACE FUNCTION refresh_recall_queues()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        rows_affected INT;
    BEGIN
        DELETE FROM daily_recall_queue WHERE due_date = CURRENT_DATE;

        INSERT INTO daily_recall_queue (id, user_id, topic_id, due_date, completed, created_at)
        SELECT 
            gen_random_uuid(),
            tr.user_id,
            tr.topic_id,
            CURRENT_DATE,
            0,                       -- pending
            now()
        FROM topic_reviews tr
        WHERE DATE(tr.next_review_at) <= CURRENT_DATE
          AND tr.next_review_at IS NOT NULL;

        GET DIAGNOSTICS rows_affected = ROW_COUNT;

        RAISE NOTICE 'refresh_recall_queues() ran at % – % rows inserted', now(), rows_affected;
    END;
    $$;
    """)

    # 3. Schedule the cron job
    op.execute("""
    SELECT cron.schedule(
        'refresh_recall_queues_job',
        '0 0 * * *',
        'SELECT refresh_recall_queues();'
    );
    """)
def downgrade():
    # Remove the cron job and the function
    op.execute("SELECT cron.unschedule('refresh_recall_queues_job');")
    op.execute("DROP FUNCTION IF EXISTS refresh_recall_queues();")