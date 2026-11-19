import pathlib
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).parent))

# Disable slowapi rate limiter during pytest runs
from app.core.limiter import limiter
from app.db import session as db_session_module

limiter.enabled = False


@pytest.fixture(autouse=True)
async def cleanup_db_connections():
    yield
    if db_session_module._engine is not None:
        await db_session_module._engine.dispose()
