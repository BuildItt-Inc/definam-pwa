"""Script to dynamically heal database migration version drifts on container start."""

import asyncio
import logging

from sqlalchemy import text

from app.db.session import _get_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def fix_drift():
    engine = _get_engine()
    try:
        async with engine.begin() as conn:
            # Check if alembic_version table exists and read its current version
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            if row:
                current_version = row[0]
                logger.info(f"Database alembic_version table holds: '{current_version}'")
                
                # These are old migration versions consolidated into 8374cdf6b920
                obsolete_versions = {
                    "45dbd516e93a",
                    "4f7d68350858",
                    "64d7c8192b15",
                    "6c4293f9ef1d",
                }
                
                if current_version in obsolete_versions:
                    logger.warning(
                        f"Detected deleted/obsolete migration version '{current_version}'. "
                        "Updating to consolidated baseline '8374cdf6b920' to prevent crash."
                    )
                    await conn.execute(
                        text("UPDATE alembic_version SET version_num = '8374cdf6b920'")
                    )
                    logger.info("Successfully updated alembic_version table.")
                else:
                    logger.info("No migration drift detected. Table is up to date.")
            else:
                logger.info("Alembic version table exists but is empty.")
    except Exception as e:
        logger.info(f"Alembic version table check skipped/not found: {e}")


if __name__ == "__main__":
    asyncio.run(fix_drift())
