# Week 11 — Progress Pipeline Fix (Part 1 + Part 2)

## What was audited/built

Two confirmed backend bugs from manual live-deployment testing:

1. **Part 1** — no signal ever created a student's first `TopicReview` row,
   so a topic that had never been reviewed could never enter the recall
   queue (chicken-and-egg: recall creates `TopicReview`, but only an
   existing `TopicReview` can make a topic due for recall).
2. **Part 1b** — even after Part 1, the streak counter only looked at
   *completed recall sessions*, so a student's very first day ever using
   the app (opening topics, reading through them) would show a streak of
   `0` — a completed recall session for a brand-new topic can't happen the
   same day by definition (SM-2 schedules the first review for tomorrow).
3. **Part 2** — suspected Groq API key / rate-limiting issue in AI chat.

All three were investigated and fixed/verified end-to-end against the real
(non-mocked) app and the live Supabase DB, using the existing `teststudent`
account (`backend/tests/create_test_user.py`).

## Correction to the original diagnosis

The brief's evidence said "no topic-completion endpoint exists — nothing
writes 'student completed this topic.'" That's true of `learning.py`, but
**`POST /topics/{id}/review` already existed** in `recall.py`
(`record_step4_attempt`), and already did the right thing on first call —
creates a `TopicReview` with `next_review_at = now + 1 day`,
`last_reviewed_at = now`. The gap was narrower than diagnosed: **the
frontend never called it.** (`frontend/hooks/useLearn.ts` doesn't exist —
there's no local/localStorage completion tracking to worry about either.)

## Files changed

| File | Change |
|---|---|
| `backend/app/api/v1/endpoints/learning.py` | Added `POST /topics/{topic_id}/activity` — lightweight, idempotent-per-day engagement ping. |
| `backend/app/api/v1/endpoints/recall.py` | `/review` and `/recall` now also call `touch_daily_activity` (defense in depth — engagement counts even if the frontend ping is missed). |
| `backend/app/services/activity.py` | New — `touch_daily_activity()`, a Postgres `ON CONFLICT DO NOTHING` upsert into `daily_activity`. |
| `backend/app/db/models.py` | New `DailyActivity` model: `(id, user_id, activity_date, created_at)`, unique on `(user_id, activity_date)`. |
| `backend/alembic/versions/05af09e7cc09_add_daily_activity_table.py` | New migration — applied to the live DB (additive `CREATE TABLE`, already run). |
| `backend/app/api/v1/endpoints/students.py` | `_compute_streak` callers (`get_dashboard`, `get_progress`) now pull from a new `_get_streak_active_days` helper — the union of `DailyActivity` days and completed-`DailyRecallQueue` days. `get_heatmap`/`get_progress`'s heatmap counts add `DailyActivity` on top of the existing `TopicReview`/`DailyRecallQueue` counts (additive, per the brief). |
| `backend/tests/test_analytics.py` | Updated the heatmap test's mock `side_effect` list — `get_heatmap` now issues one more query. |
| `frontend/lib/api/topics.ts` | Added `pingTopicActivity(topicId)` (fire-and-forget) and `submitTopicCompletion(topicId, accuracyScore)`. |
| `frontend/app/(student)/student/learn/[topicId]/page.tsx` | Calls `pingTopicActivity` once when topic content successfully loads (not gated on completion); calls `submitTopicCompletion` when the last practice question is answered. |

## Part 1a — pg_cron: already scheduled, no action needed

```sql
SELECT * FROM cron.job WHERE jobname = 'refresh_recall_queues_job';
-- (1, 'refresh_recall_queues_job', '0 0 * * *', 'SELECT refresh_recall_queues();', true)
```
Checked directly against the live Supabase project (read-only). The
extension is installed and the job is active. Nothing to do here — this
was **not** the blocker.

## End-to-end verification (live DB, `teststudent` account)

Ran the real FastAPI app in-process (`httpx.AsyncClient` +
`ASGITransport`, no mocking) against the live Supabase/Redis, topic
"Fractions" (`412cf686-1ec5-4b70-90ac-04a0f19c7c6e`):

1. `POST /topics/{id}/activity` → `200 {"ok": true}`; confirmed a
   `daily_activity` row for today.
2. `POST /topics/{id}/review` (accuracy_score=80) → `200`, created
   `topic_reviews` row: `ease_factor=2.5, interval_days=1, repetitions=0,
   next_review_at=tomorrow, last_reviewed_at=now`. Confirmed via direct SQL.
3. `GET /students/dashboard` → `streak_days: 1` (previously would've been
   `0` — this is the Part 1b fix working).
4. `GET /student/progress` → `streak_days: 1, topics_studied: 1`.
5. `GET /students/me/heatmap` → today's entry `count: 2` (1 from
   `TopicReview.last_reviewed_at`, 1 from `DailyActivity` — both signals
   are additive by design, so a single day's engagement can show >1;
   flagging this as a minor semantic note, not a bug).
6. To test the recall-queue mechanism without waiting a day: manually
   rewound *that one test row's* `next_review_at` to yesterday, ran
   `SELECT refresh_recall_queues();` directly (same SQL the cron job
   runs), and confirmed a `daily_recall_queue` row was created
   (`completed=0`).
7. `GET /recall/queue` → topic now present in the response.
8. `POST /topics/{id}/recall` (rating=4, the `rating >= 3` branch of
   `sm2_calculate`) → `200`, `repetitions: 0→1`, `next_review_at` advanced
   to tomorrow. The `rating < 3` branch was verified by code review
   (`sm2.py`'s reset path is a straightforward unconditional branch) but
   not separately live-exercised — low risk, flagging for completeness.

This is real data now sitting under the `teststudent` account in the live
DB (topic_reviews, daily_activity, daily_recall_queue rows for the
"Fractions" topic) — left in place as evidence rather than cleaned up,
consistent with `teststudent` being the designated account for this kind
of manual verification.

## Part 2 — AI chat

Ran a full local E2E test (same in-process approach) against
`GET /chat/stream`:

- Streaming responded `200`, produced 99 SSE events ending in `[DONE]`,
  real tutor content came back.
- `GET /chat/history` afterward showed 2 persisted messages (user +
  assistant, with token counts).
- Rate-limit boundary: manually set the Redis counter to 50, confirmed the
  51st request correctly returns `429 {"code": "RATE_LIMIT_EXCEEDED"}`.
  Read through `usage.py`'s DB-backed fallback counter too — no bug found
  in either path.

**What this confirms vs. what it doesn't:** `GROQ_API_KEY` in the local
`backend/.env` is valid and the code path works correctly end-to-end. It
does **not** confirm the *deployed* backend has the same key set — I don't
have access to wherever the backend actually runs (a code comment in
`app/core/config.py` suggests Coolify, not Railway/Render). **Team:
please confirm `GROQ_API_KEY` is set in the deployed backend's
environment** (not Vercel — that's frontend-only) and, if chat is still
broken there after confirming the key, it's not the two causes ruled out
here (bad key logic, rate-limit bug) — worth checking deploy logs for the
actual error.

## Gaps / follow-ups

- If a topic has zero practice questions, Step 4 shows "No practice
  questions available for this topic." with no CTA to proceed — that
  topic can never trigger `submitTopicCompletion`, so it can never enter
  the recall queue. Pre-existing, out of scope here; flagged for Part 3.
- Heatmap day-counts are now a sum of independent activity signals, not a
  literal distinct-action count — worth knowing if the heatmap UI ever
  needs to explain what "count" means.
- `sm2_calculate`'s `rating < 3` branch wasn't live-exercised end-to-end
  (only code-reviewed).
