import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

# Disable slowapi rate limiter during pytest runs
from app.core.limiter import limiter

limiter.enabled = False

