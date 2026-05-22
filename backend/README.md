# DefinAm Backend

FastAPI backend for the DefinAm learning platform.

## Stack

- **Framework**: FastAPI
- **Python**: 3.12
- **Package manager**: uv
- **Database**: Supabase (PostgreSQL)
- **Migrations**: Alembic
- **Auth**: Supabase Auth (individuals/admins) + custom JWT (org students)
- **Email**: Resend (SMTP fallback)
- **Payments**: Paystack

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/     # Route handlers
│   │   │   │   ├── auth.py
│   │   │   │   ├── health.py
│   │   │   │   ├── payments.py
│   │   │   │   └── webhooks.py
│   │   │   └── router.py      # Aggregates all v1 routers
│   │   └── deps.py            # FastAPI dependencies
│   ├── core/
│   │   ├── config.py          # pydantic-settings
│   │   ├── email.py           # Resend + SMTP fallback
│   │   └── security.py        # JWT, bcrypt, code generation
│   ├── db/
│   │   └── database.py        # Async Supabase client
│   ├── models/                # SQLAlchemy ORM models (future)
│   ├── repositories/          # DB access layer (future)
│   ├── schemas/               # Pydantic request/response models (future)
│   ├── services/              # Business logic (future)
│   ├── tasks/                 # Background tasks (future)
│   ├── templates/
│   │   └── emails/            # Jinja2 email templates (future)
│   └── main.py                # App factory
├── alembic/                   # Database migrations
├── scripts/                   # One-off utility scripts
├── tests/
│   ├── test_main.py
│   ├── test_security.py
│   ├── test_auth.py
│   └── test_webhooks.py
├── .env.example
├── .pre-commit-config.yaml
├── alembic.ini
└── pyproject.toml
```

## Quick Start

```bash
cp .env.example .env       # fill in your values
uv sync --extra dev
uv run uvicorn app.main:app --reload  # → http://localhost:8000
```

## API Docs

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Running Tests

```bash
uv run pytest
```

## Linting

```bash
uv run ruff check .
uv run ruff format .
```

## Migrations

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```
