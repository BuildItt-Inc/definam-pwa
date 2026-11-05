# Deployment, Backup & Rollback Runbook

## Overview
This runbook documents the standard operating procedures for deploying, backing up, and rolling back the DefinAm / Recall platform (FastAPI Backend + Next.js PWA Frontend).

---

## 1. Branch Strategy & Environments
- **`main`**: Production release branch. Deployed to production infrastructure.
- **`dev`**: Active integration & staging branch.
- **`feature/*`**: Scoped branches merged into `dev` via Pull Request after CI checks pass.

---

## 2. Standard Deployment Procedure

### Backend (Coolify / VPS / Container)
1. **Pull latest code**:
   ```bash
   git checkout <branch>
   git pull origin <branch>
   ```
2. **Install & sync dependencies**:
   ```bash
   cd backend
   uv sync --extra dev
   ```
3. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```
4. **Restart process / container**:
   ```bash
   # If running via systemd:
   systemctl restart definam-backend
   # Or container redeploy:
   docker compose restart backend
   ```
5. **Verify health check**:
   ```bash
   curl -f http://127.0.0.1:8000/api/v1/health || exit 1
   ```

### Frontend (Vercel / Node)
1. Pull latest code or push to deployment trigger branch.
2. Build and verify:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

---

## 3. Database Backup Procedure

An automated, compressed backup script is located at `backend/scripts/backup_db.sh`.

### Manual Backup:
```bash
./backend/scripts/backup_db.sh /path/to/backup/destination
```
By default, backups are saved to `${HOME}/backups/definam/` with timestamps (`definam_YYYYMMDD_HHMMSS.sql.gz`) and pruned automatically after 7 days.

### Automated Daily Cron:
Add to the server's crontab (`crontab -e`):
```cron
# Run daily database backup at 2:00 AM UTC
0 2 * * * /path/to/definam-pwa/backend/scripts/backup_db.sh >> /var/log/definam_backup.log 2>&1
```

---

## 4. Rollback Procedures

### Scenario A: Bad Backend Code Deployment (No Migration Drift)
1. Revert to the last known good commit:
   ```bash
   git checkout <previous_commit_sha>
   # or create a revert PR: git revert <bad_commit_sha>
   ```
2. Resync dependencies and restart the service:
   ```bash
   cd backend && uv sync
   systemctl restart definam-backend
   ```

### Scenario B: Bad Database Migration Rollback
1. Identify the previous Alembic revision:
   ```bash
   uv run alembic history --verbose -n 3
   ```
2. Downgrade by 1 step (or to specific revision ID):
   ```bash
   uv run alembic downgrade -1
   # Or: uv run alembic downgrade <previous_revision_id>
   ```
3. If migration downgrade cannot be safely performed due to data corruption, restore from backup (Scenario C).

### Scenario C: Database Restoration from Backup
1. Stop backend services to prevent incoming writes:
   ```bash
   systemctl stop definam-backend
   ```
2. Restore using the companion script:
   ```bash
   ./backend/scripts/restore_db.sh /path/to/backup/definam_YYYYMMDD_HHMMSS.sql.gz
   ```
3. Restart backend services:
   ```bash
   systemctl start definam-backend
   ```

### Scenario D: Frontend Deployment Rollback (Vercel)
1. Open the Vercel Project Dashboard.
2. Navigate to **Deployments**.
3. Select the previous stable deployment and click **Promote to Production** (instant rollback without waiting for a rebuild).
