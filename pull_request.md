# PR Title: feat: native postgresql migration & backend security hardening patches

## Description

This PR delivers a major overhaul to our backend infrastructure, covering two primary phases:
1. **Native PostgreSQL Migration:** Removed all `supabase` client dependencies and moved to direct, high-performance PostgreSQL + SQLAlchemy (async) + Alembic migrations.
2. **Backend Security & Performance Hardening:** Patched several critical security vulnerabilities and performance bottlenecks found during a deep-dive security audit without breaking existing user flows or stateless mechanics.

### Key Changes In Detail:

#### Direct Async Database Layer & Models
* Dropped `supabase` and integrated `sqlalchemy[asyncio]` and `asyncpg`.
* Created standard SQLAlchemy ORM models (`School`, `User`, `AccessCode`, `ProcessedWebhook`) inside `app/db/models.py`.
* Configured Alembic and generated the initial schema migration (`6c4293f9ef1d_initial_schema.py`).
* Rewrote all database CRUD and helper functions in `app/db/database.py` with raw async SQL statements using SQLAlchemy.

#### 🔒 Webhook Resilience & Fixes
* Fixed duplicate school/user creation during Paystack webhook retries by updating existing records' seat count rather than attempting redundant inserts that triggered unique constraint crashes.
* **Webhook Reliability Fix:** Removed the catch-all `except Exception` inside `webhook_service.py` that silently dropped webhook failures with an HTTP 200. We now correctly re-raise errors so FastAPI returns an HTTP 500 when systems (like DB/SMTP) fail, allowing Paystack's retry queue to handle transient failures.

#### 🛡️ Authentication Security Hardening
* **Missing Rate Limiting Patched:** Applied `slowapi` rate limiters to authentication endpoints (`/login`, `/org-login`, `/register`, `/change-password`, `/refresh`) to block credential stuffing and brute force attempts.
* **Input Length Constraints:** Enforced password length limits between `8` and `128` characters, and username limits of `150` characters in Pydantic schemas to shield the server from large string-based complexity DoS attacks.
* **Async Hashing (Event Loop Stalling Fixed):** Refactored CPU-intensive bcrypt functions (`hash_password` and `verify_password` inside `app/core/security.py`) to run asynchronously inside thread pools using `anyio.to_thread.run_sync`. This stops standard hashing from blocking FastAPI's single-threaded async event loop under concurrent load.

---

## Related Issue (Link to issue ticket)
Addresses backend stability, Paystack webhook idempotent handling, password complexity policies, and brute-force protection.

---

## Motivation and Context
* Resolves the unique constraint crashes during duplicate/retried webhook checkouts.
* Secures user-facing authentication entrypoints from credential stuffing.
* Prevents performance DoS where hashing multiple concurrent user requests synchronous blocked all incoming API connections.

---

## How Has This Been Tested?

### 1. Automated pytest Suite
- Successfully ran the entire updated test suite (25 tests total) with 100% success.
- Mocked/configured rate limiter disabling in `tests/conftest.py` so rapid successive unit tests do not hit `429 Too Many Requests`.
- To run tests locally:
  ```bash
  PYTHONPATH=. uv run pytest
  ```

### 2. Native PostgreSQL Smoke Tests
- Executed `tests/smoke_test.py` to confirm Alembic migrations, database connectivity, and direct user creation + access code redemption pipeline behaves correctly.

---

## Types of changes
- [x] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

---

## Checklist:
- [x] My code follows the code style of this project.
- [x] My change requires a change to the documentation.
- [x] I have updated the documentation accordingly.
- [x] I have read the **CONTRIBUTING** document.
- [x] I have added tests to cover my changes.
- [x] All new and existing tests passed.
