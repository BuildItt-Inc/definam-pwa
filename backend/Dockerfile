# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY pyproject.toml uv.lock ./

# Install production dependencies only (no dev extras)
RUN uv sync --frozen --no-dev --no-install-project

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Security: run as non-root
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid 1000 --create-home appuser

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application source code
COPY alembic.ini ./
COPY alembic/ ./alembic/
COPY app/ ./app/
COPY scripts/ ./scripts/

# Put the venv on PATH so `python`, `uvicorn`, `alembic` resolve correctly
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create an entrypoint script that runs migrations then starts the server
COPY <<'EOF' /app/entrypoint.sh
#!/usr/bin/env bash
set -e

echo "▶ Checking for database migration drifts …"
python -m scripts.fix_migration_drift

echo "▶ Running Alembic migrations …"
alembic upgrade head

echo "▶ Starting Uvicorn …"
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers "${WEB_CONCURRENCY:-1}" \
    --proxy-headers \
    --forwarded-allow-ips='*'
EOF
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"]

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
