# Week 14 — Refresh-Cookie Secure/SameSite Hardening

## What was audited/built

Follow-up from the chat-behavior work (`feature/fix-chat-behavior`): while
investigating a page-refresh logout during local testing, traced it to a
test-environment artifact (frontend on `localhost:3000`, backend on
`127.0.0.1:8004` — different hostnames, so the `SameSite=Lax` refresh
cookie was correctly withheld by the browser on the cross-site request).
Confirmed this by pointing the frontend at a matching hostname
(`localhost:8004`) and getting a clean single refresh call — not a race,
not a backend bug, just mismatched local ports.

That investigation surfaced a separate, real risk worth fixing on its own
branch (`hotfix/cookie-secure-config`, based on `dev` — unrelated to the
chat work, so kept out of that PR).

## The real issue

`eba9d13` ("fix(auth): cross-origin cookie and session recovery", 2026-07-13)
previously fixed "every page-refresh logout" in production by forcing the
refresh cookie to `SameSite=None; Secure` — required because the frontend
(Vercel) and backend (Coolify) are on different origins, and
`SameSite=Strict`/`Lax` cookies are withheld by the browser on cross-site
requests.

At some point after that fix, `_set_refresh_cookie` in
`backend/app/api/v1/endpoints/auth.py` was changed to *infer* whether to
use the secure pairing from `settings.frontend_url.startswith("https://")`
— presumably to let plain-HTTP local dev keep working (a `Secure` cookie
is silently dropped entirely over HTTP, so hardcoding
`Secure=True`/`SameSite=None` would have broken local dev outright).

The problem: `frontend_url` defaults to `"http://localhost:3000"`, and
nothing enforces that the deployed backend's `FRONTEND_URL` env var is
actually set to an `https://` URL. If it's ever missing, blank, or
mistyped in the real deployment, `is_secure` silently becomes `False`,
the cookie falls back to `SameSite=Lax` without `Secure`, and — because
the real frontend and backend are cross-origin — **every real user would
be logged out on every page refresh**, reproducing the exact bug `eba9d13`
already fixed once, with no error or warning anywhere to catch it.

## Fix

- Added an explicit `cookie_secure: bool` setting (`config.py`), decoupled
  entirely from `frontend_url` (which keeps its original, unrelated job:
  building password-reset and payment-callback URLs). Defaults to `False`
  so local HTTP dev is unaffected — this is the same effective cookie
  behavior local dev had before this change.
- `_set_refresh_cookie`/`_clear_refresh_cookie` now read
  `settings.cookie_secure` directly instead of guessing from a URL string.
- Added a startup-time `logger.warning(...)` in `main.py` that fires
  whenever `cookie_secure` is `False`, explaining plainly that this is
  expected for local dev but would silently break every session in a real
  cross-origin deployment. Makes a missing/wrong setting visible in the
  deploy logs immediately instead of only showing up as vague "I keep
  getting logged out" reports later.
- Documented `COOKIE_SECURE` in `.env.example` with the same warning.

## Action required (outside what I can do)

**`COOKIE_SECURE=true` must be set in the actual deployed backend's
environment (Coolify) for this fix to take effect in production.** I
don't have access to that deployment's env vars to check or set it
myself — someone with Coolify access needs to add it. Until it's set,
behavior is unchanged from before this branch (same latent risk as
today, just now loudly logged on every backend startup instead of silent).

## Testing

- `backend/tests/test_auth.py` — two new tests asserting the `Set-Cookie`
  header is `SameSite=None; Secure` when `cookie_secure=True`, and
  `SameSite=Lax` without `Secure` when `cookie_secure=False`.
- `uv run pytest` — 48 passed, 1 skipped. `ruff check` clean.
- Could not live-test the `cookie_secure=True` cross-origin path end to
  end locally: browsers refuse to store `Secure` cookies over plain HTTP
  at all, so this path is only exercisable over real HTTPS. The
  `cookie_secure=False` (default) path was already live-verified earlier
  — confirmed working correctly for same-origin local HTTP dev.

## Gaps / follow-ups

- Confirm `COOKIE_SECURE=true` is actually set in the live Coolify
  backend environment (see "Action required" above) — this PR's code
  change is inert without it.
