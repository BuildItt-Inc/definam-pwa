"""add_pg_cron_job_and_function

Revision ID: <your-revision-id>
Revises: <previous-revision>
Create Date: 2026-06-30 12:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '7e0d385e1fe8'          # keep the one that was generated
down_revision = '8374cdf6b920'  # keep the one from the file
branch_labels = None
depends_on = None

def upgrade():
    import sqlalchemy as sa

    connection = op.get_bind()

    # 1. Check if pg_cron is available
    result = connection.execute(
        sa.text("SELECT name FROM pg_available_extensions WHERE name = 'pg_cron'")
    )
    has_pg_cron = result.fetchone() is not None

    if has_pg_cron:
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_cron;")

    # 2. Create the refresh_recall_queues() function (always run, does not depend on pg_cron extension)
    op.execute("""
    CREATE OR REPLACE FUNCTION refresh_recall_queues()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        rows_affected INT;
    BEGIN
        DELETE FROM daily_recall_queue WHERE DATE(due_date) = CURRENT_DATE;

        INSERT INTO daily_recall_queue (id, user_id, topic_id, due_date, completed, created_at)
        SELECT
            gen_random_uuid(),
            tr.user_id,
            tr.topic_id,
            CURRENT_DATE,
            0,
            now()
        FROM topic_reviews tr
        WHERE DATE(tr.next_review_at) <= CURRENT_DATE
          AND tr.next_review_at IS NOT NULL;

        GET DIAGNOSTICS rows_affected = ROW_COUNT;

        RAISE NOTICE 'refresh_recall_queues() ran at % – % rows inserted', now(), rows_affected;
    END;
    $$;
    """)

    # 3. Schedule the daily cron job (midnight UTC) if pg_cron is available
    if has_pg_cron:
        op.execute("""
        SELECT cron.schedule(
            'refresh_recall_queues_job',
            '0 0 * * *',
            'SELECT refresh_recall_queues();'
        );
        """)
    else:
        print(
            "WARNING: pg_cron extension is not available on this PostgreSQL instance. "
            "Skipping cron job scheduling. Ensure pg_cron is enabled on production."
        )


def downgrade():
    import sqlalchemy as sa

    connection = op.get_bind()
    result = connection.execute(
        sa.text("SELECT name FROM pg_available_extensions WHERE name = 'pg_cron'")
    )
    has_pg_cron = result.fetchone() is not None

    if has_pg_cron:
        op.execute("SELECT cron.unschedule('refresh_recall_queues_job');")

    op.execute("DROP FUNCTION IF EXISTS refresh_recall_queues();")