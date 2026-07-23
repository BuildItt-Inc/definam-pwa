# DefinAm — End-to-End Audit Report

**Date:** 2026-07-23
**Method:** Live testing against the real (non-mocked) FastAPI app and the
live Supabase/Redis backend, using the designated test accounts
(`teststudent` / `testadmin`, both pre-existing conventions in
`backend/tests/create_test_user.py` and `backend/scripts/create_test_admin.py`),
plus direct code review for anything that couldn't be safely live-tested
(real payments, real push sends, deployed-infra env vars).

Every claim below states what was actually run/read — no speculation. Two
critical, live-reproduced bugs were found during this pass and are flagged
at the top; per direction, they were **not** fixed here — each needs its
own scoped follow-up PR.

---

## 🔴 Critical findings (own follow-up PRs)

### 1. Admin org-scoping is silently broken (BOLA) — `backend/app/services/auth_service.py:102-103`

`login()` — the only login path admins use — builds the JWT with just
`{"role": role}`. It never includes `org_id`, even though the pattern
already exists correctly two functions away in `org_login` (line 150) and
`refresh` (lines 216-217).

**Impact:** every `if org_id:` scoping check in `admin.py`
(`get_admin_stats`, `list_codes`, `download_codes`, `revoke_code`,
`get_student_detail`) silently no-ops for any admin logged in the normal
way. A school admin can currently see platform-wide stats instead of their
own school's, view/download **every** school's access codes, **revoke
another school's access codes**, and pull any student's full drill-down
(chat history included) regardless of school.

**Live proof:** logged in as `testadmin` (confirmed `org_id` is correctly
set on the DB row). `GET /admin/stats` returned `avg_accuracy: 80.0,
active_subjects_count: 1` — numbers that exactly match `teststudent` (an
unrelated *individual* student, not in `testadmin`'s school), because the
org filter was silently skipped.

**Fix shape** (not applied): mirror `org_login`/`refresh` — include
`org_id` in `login()`'s `extra_claims` when the user row has one.

### 2. Every individual payment → registration currently fails — `backend/app/api/v1/endpoints/payments.py:68`

`verify_payment` sets `code.status = "active"` immediately after Paystack
confirms the charge. But `register()` (`auth_service.py:58`) requires
`code_row["status"] == "pending"` and only *it* is supposed to consume the
code (via `activate_code`). The `/pay/callback` page's own on-screen
instructions tell the paying customer to go register with the code they
were just emailed — by which point `verify_payment` has already marked it
"used."

**Live proof:** simulated the real sequence — inserted a `pending`
individual code (what the webhook does), flipped it to `active` (what
`verify_payment` does), then called `POST /auth/register` with that code:
`400 {"detail": "This access code has already been used."}`. 100%
reproducible — this is the exact path every paying individual customer
follows.

**Fix shape** (not applied): `verify_payment` should confirm payment
succeeded without touching `status` — leave the code `pending` so
`register()`'s `activate_code()` remains the only thing that ever consumes
it.

---

## Part 1 / Part 2 — already fixed and merged (this session)

See `frontend/docs/WEEK11_PROGRESS_PIPELINE_FIX.md` for full detail. Summary:

- **Topic completion → recall eligibility**: the endpoint already existed
  (`POST /topics/{id}/review`) but nothing called it. Wired it into the
  topic page; also added `POST /topics/{id}/activity`, a lightweight
  engagement ping.
- **Streak was 0 on a student's first day even after the above**, because
  it only counted completed recall sessions (which can't happen the same
  day a topic is first opened). Added a `daily_activity` table and folded
  it into the streak/heatmap calc. Also fixed the same missing signal in
  `admin.py`'s separate (duplicate) streak calculation for the student
  drill-down view, discovered while making this exact change — was about
  to show different numbers than the student's own dashboard.
- **pg_cron**: confirmed already scheduled and active — not a blocker.
- **AI chat**: Groq key + rate-limit logic verified correct via live
  end-to-end test. Deployed-backend env var still needs confirming by
  whoever manages that infra (Coolify, per a code comment — not
  Railway/Render as originally guessed, and not Vercel).

All verified end-to-end live (streaming, DB rows, SM-2 both branches —
`rating >= 3` and `rating < 3` — the recall queue SQL function, etc.)

---

## Part 3 — systematic pass, by area

### Auth (`auth.py`) — ✅ works as expected

Live-tested against the real app:
- Register with a valid individual code → `201`, tokens issued.
- Register again with the now-used code → `400 "already been used"`
  (correct — this is the *same* mechanism broken by Critical Finding #2
  above, just exercised directly rather than via the payment flow).
- Login, correct password → `200`.
- Login, wrong password → `401 INVALID_CREDENTIALS` (doesn't leak whether
  the username exists).
- Forgot-password with a real email → `200` "if an account exists..."
  message, even though `RESEND_API_KEY` is an empty placeholder locally
  (email send fails silently, caught by the endpoint's own
  `except Exception: pass` — by design, not a bug).
- Reset-password with a garbage token → `400 "Invalid or expired reset
  token"`.
- Logout → `200`, cookie cleared.

Not separately tested: an *actually expired* (not just invalid) reset
token — `consume_password_reset_token`'s `expires_at` check was read, not
independently exercised (would require manipulating the clock or waiting
an hour).

### Learning flow (`learning.py` + topic pages) — ✅ works, per the earlier rendering-fix sessions + this pass

Steps are Def (1) → Example (2) → Visual Breakdown (3) → Practice (4) →
AI Tutor (5, the chat scaffold — confirmed by reading
`app/(student)/student/learn/[topicId]/page.tsx`'s `AITutorScaffold`).

Content-rendering correctness across topics was already the subject of
the prior `feature/fix-math-content-rendering` work (bold/italic markdown,
multi-line math, bullet/numbered lists, mhchem) — verified there against
real generated content for Preparation of Salts, Binary Operations, and
Algebraic Expressions. This pass additionally live-fetched two more real
topics (Percentages, Main Ideas — a different subject/chapter) and
confirmed `$`-delimited math renders correctly and practice questions
generate.

**Known gap, not fixed here**: if a topic has zero practice questions,
Step 4 shows "No practice questions available for this topic." with no
CTA to proceed — that topic can never trigger `submitTopicCompletion`, so
it can never enter the recall queue. Pre-existing, narrow edge case.

### Progress + streaks (`students.py`) — ✅ fixed this session, see Part 1 above

### Recall (`recall.py`) — ✅ works as expected

Full loop verified live this session (see Part 1): complete a topic →
manually advance a day (SQL, for testing only) → `refresh_recall_queues()`
→ topic appears in `GET /recall/queue` → submit a rating → both SM-2
branches (`rating >= 3`: repetitions advances, interval grows;
`rating < 3`: resets to `repetitions=0, interval=1`) confirmed correct via
live `POST /topics/{id}/recall` calls.

### Chat (`chat.py`) — ✅ works locally; deployed-env unconfirmed

See Part 2 above. Streaming, history persistence, and the 51st-message
`429` rate-limit boundary all verified live. `usage.py`'s DB-backed
fallback counter read through — no bug found.

### Payments (`payments.py`, `webhooks.py`) — ❌ critical bug (see above); rest ⚠️ code-reviewed only

- Webhook signature verification: HMAC-SHA512 with constant-time compare
  (`hmac.compare_digest`), tries both `paystack_secret_key` and
  `paystack_webhook_secret` — correct implementation.
- Idempotency: `is_webhook_processed`/`mark_webhook_processed` guard
  against double-processing the same reference — correct.
- Could not do a real sandbox transaction — `PAYSTACK_SECRET_KEY` in the
  local `.env` is a literal placeholder (`sk_test_xxxxx`), not a working
  test key. Org payment flow (`_handle_org`) was code-reviewed only
  (school creation, seat increment on repeat purchase, admin account
  reuse with `force_password_change`) — no live verification.

### Admin (`admin.py`, `internal.py`) — ❌ critical bug (org-scoping, see above); authorization itself works

- `AdminDep`/`get_current_admin` (`app/api/deps.py:69-73`) correctly
  enforces `role == "admin"` server-side. Live-tested: `GET /admin/stats`
  with a student token → `403`; with an admin token → `200`.
- `internal.py` (topic approve/publish) correctly gated by `AdminDep`,
  correctly enforces the draft→approved→published state machine (rejects
  out-of-order transitions with `400`). Global by design (topics aren't
  per-school), so not subject to the org-scoping bug above.
- `list_codes`/`download_codes`/`revoke_code`/`get_student_detail` are
  *written* with BOLA protection (`if org_id: query.where(...)`) — the
  protection code is correct, it's just never activated because `org_id`
  never reaches the JWT (Critical Finding #1).

### Cross-cutting

- **Device fingerprinting** (`fingerprint_device`, used in `org_login`,
  `auth_service.py:125-146`) — ⚠️ partially works. It's a soft
  anti-sharing measure for org (access-code-only) students: logging in
  from a new device swaps which fingerprint is considered "the" device
  for that code, logged via `logger.info`. It does **not** revoke
  already-issued JWTs for the previous device (stateless JWTs can't be
  blocklisted here) — two people sharing one code can both keep operating
  until their existing tokens expire. Also, the fingerprint is derived
  from IP + user-agent, so a legitimate student on a carrier network with
  rotating IPs could get flagged as "new device" on a normal day.
- **Push notifications** — 🚧 not implemented end-to-end.
  `send_daily_recall_push` (`app/services/push.py`) and
  `send_daily_pushes.py` are both written correctly, but:
  (a) `ONESIGNAL_APP_ID`/`ONESIGNAL_API_KEY` are placeholder values
  (`your_app_id`/`your_rest_api_key`) in the local `.env` — not
  configured with real credentials anywhere checked, and
  (b) `send_daily_pushes.py`'s own docstring says "run this daily via a
  scheduler" — there is no scheduler. Checked `.github/workflows/`
  (only `backend-ci.yml`/`frontend-ci.yml`, both CI not cron), and no
  Procfile/railway.json/render.yaml/Coolify cron config exists anywhere
  in the repo. The script can only be run manually today.
- **PWA** — ⚠️ partially works. Service worker registers via `next-pwa`
  (`next.config.js`) with `register: true, skipWaiting: true`; no custom
  `runtimeCaching` is configured, so it falls back to `next-pwa`'s library
  defaults (not custom-tuned, but not broken). However,
  **`public/manifest.json`'s `"icons"` array is empty**, and
  `public/icons/` contains only a `.gitkeep` placeholder — no icon assets
  were ever added. This almost certainly fails Chrome's installability
  criteria (a valid manifest needs at least one icon), so the "Add to
  Home Screen" / install-prompt experience is likely broken or shows a
  blank/generic icon. Did not browser-test the actual install prompt
  (no browser automation available in this session) — flagging from the
  manifest evidence, which is unambiguous.

---

## Not covered in this pass

- Real Paystack sandbox transaction (individual + org) — no working test
  key available locally.
- Real OneSignal push send — no working credentials, and sending a real
  push isn't something to do without explicit sign-off anyway.
- Actual browser-based PWA install-prompt / offline-behavior testing — no
  browser automation tool available this session; the manifest.json/icons
  gap was found via code inspection, which is conclusive enough to flag
  but wasn't visually confirmed in a browser.
- Frontend-side route guarding for `/admin/*` pages (whether a
  non-admin gets redirected client-side, independent of the backend's
  correct 403) — not checked.
- An *expired* (as opposed to merely invalid) password-reset token.

## Suggested next steps

1. Two critical-bug follow-up briefs (org-scoping JWT fix, payment/register
   status-flag fix) — both are small, contained fixes once someone signs
   off on timing.
2. Add real PWA icons + wire them into `manifest.json`.
3. Wire `send_daily_pushes.py` to an actual scheduler once real OneSignal
   credentials are available.
4. Decide whether the Step-4-with-zero-questions dead end needs a fix.
