# DefinAm PWA

Monorepo for the DefinAm College Mode learning platform — a Next.js PWA frontend paired with a FastAPI backend.

## Repository Structure

```
definam-pwa/
├── frontend/          # Next.js 15 PWA (App Router, TypeScript, Tailwind CSS)
└── backend/           # FastAPI REST API (Python 3.12, uv)
```

## Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth & DB**: Supabase
- **Cache**: Upstash Redis

### Backend
- **Framework**: FastAPI
- **Runtime**: Python 3.12
- **Package manager**: uv
- **Linting**: Ruff
- **Testing**: pytest

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production |
| `dev` | Staging |
| `feature/*` | Feature branches |

## Quick Start

### Frontend

```bash
cd frontend
cp .env.example .env.local   # fill in your values
npm install
npm run dev                   # → http://localhost:3000
```

### Backend

```bash
cd backend
cp .env.example .env   # fill in your values
uv sync --extra dev
# runs database migrations
uv run alembic upgrade head
# starts backend server in dev mode → http://localhost:8000
uv run fastapi dev app/main.py
```

## CI/CD Pipeline

GitHub Actions runs three jobs on every push/PR to `main` or `dev`:

| Job | What it does |
|---|---|
| `frontend` | `npm ci` → lint → type-check → test → build |
| `backend` | `uv sync` → `ruff check` → `pytest` |
| `trivy-scan` | Filesystem vulnerability scan (CRITICAL/HIGH CVEs), results uploaded to GitHub Security tab |

## Pre-commit Hooks

Husky runs automatically on `git commit`:

- **Frontend** — `lint-staged` runs ESLint on staged `*.ts/tsx/js/jsx` files inside `frontend/`
- **Backend** — `ruff check` runs on any staged `*.py` files inside `backend/`

## Routes

- `/login`
- `/activate`
- `/student` — learn, recall, chat, progress
- `/admin` — IDs, reports

## Notes

- `frontend/.env.local` is git-ignored.
- `backend/.env` is git-ignored.
- `frontend/public/sw.js` is a placeholder — `next-pwa` generates the service worker at build time.
