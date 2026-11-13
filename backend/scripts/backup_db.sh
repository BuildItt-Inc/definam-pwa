#!/usr/bin/env bash
# ==============================================================================
# DefinAm Database Automated Backup Script
# Usage: ./scripts/backup_db.sh [backup_directory]
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${1:-${HOME}/backups/definam}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/definam_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

# Source environment variables if .env exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ -f "${ENV_FILE}" ]]; then
    # Extract DATABASE_URL
    RAW_DB_URL=$(grep -E "^DATABASE_URL=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    # Strip async driver prefix if present (e.g., postgresql+asyncpg:// -> postgresql://)
    DB_URL="${RAW_DB_URL//+asyncpg/}"
else
    DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/definam}"
fi

echo "=========================================="
echo "Starting PostgreSQL backup: definam"
echo "Target file: ${BACKUP_FILE}"
echo "Time: $(date)"
echo "=========================================="

# Check pg_isready
if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -d "${DB_URL}" || { echo "ERROR: PostgreSQL is not ready or accessible."; exit 1; }
fi

# Run pg_dump piped through gzip
pg_dump --no-owner --clean --if-exists "${DB_URL}" | gzip -9 > "${BACKUP_FILE}"

# Verify backup size
FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
if [[ "${FILE_SIZE}" -le 50 ]]; then
    echo "ERROR: Backup file is empty or suspiciously small (${FILE_SIZE} bytes)."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

echo "✓ Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE} bytes)"

# Prune old backups past retention threshold
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "definam_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
echo "✓ Pruning complete."
