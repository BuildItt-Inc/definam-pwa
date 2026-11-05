#!/usr/bin/env bash
# ==============================================================================
# DefinAm Database Restore Script
# Usage: ./scripts/restore_db.sh <backup_file.sql.gz>
# ==============================================================================

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ -f "${ENV_FILE}" ]]; then
    RAW_DB_URL=$(grep -E "^DATABASE_URL=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    DB_URL="${RAW_DB_URL//+asyncpg/}"
else
    DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/definam}"
fi

echo "=========================================="
echo "WARNING: This will restore database from ${BACKUP_FILE}"
echo "Target DB: ${DB_URL}"
echo "=========================================="

gunzip -c "${BACKUP_FILE}" | psql "${DB_URL}"

echo "✓ Database restored successfully."
