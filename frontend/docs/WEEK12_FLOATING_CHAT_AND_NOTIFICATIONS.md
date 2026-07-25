# Week 12 — Floating Global AI Chat + Notification/Celebration System

## What was built

**Part 1 — Floating global AI chat**: a persistent chat bubble (bottom-right)
available on every student-facing page, independent of the existing
per-topic Step 5 chat (kept unchanged). Supports optional topic context,
plus a "why is this wrong?" hook on missed practice questions.

**Part 2 — Notifications**: two tiers. Corner toasts (`sonner`) for
completion/recall/error events. A custom full-screen `CelebrationOverlay`
(no library — CSS keyframes) for login/streak/payment-success.

All backend changes were verified live against the real Supabase DB using
the `teststudent` test account (both via scripted API calls and, for this
task specifically, a real headless-browser session against a running
`uvicorn` + `next dev` pair — see Testing below).

## Track A: chat unification

### Backend (`backend/app/api/v1/endpoints/chat.py`, `backend/app/services/chat.py`)

`topic_id` is now optional on both `GET /chat/history` and
`GET /chat/stream` (`ChatMessage.topic_id` was already nullable in the DB —
the gap was purely in the endpoint signatures, which required it). Omitting
it means the general floating chat: `topic_id IS NULL` scopes its own
history, cleanly separate from any topic's Step-5 history — confirmed live
(sent messages to both, each stayed in its own bucket).

The daily rate limit (`chat:count:{user_id}:{date}`, 50/day) was **already**
a single Redis key per user regardless of topic — no change needed there,
it was already shared correctly. Live-confirmed: forced the counter to 50,
both entry points hit the same `429`.

The system prompt (`stream_groq_response`) previously always said "stay
strictly within the provided topic context" even when there was no
context — for general chat this would've told the model to stay within an
empty context. Now branches: with a topic, same instruction as before;
without one, told explicitly this is a general conversation, answer
broadly per the WAEC/Nigerian curriculum.

### Frontend

- `lib/api/chat.ts`: `topicId` is now `string | undefined` on both
  functions. Added a typed `ChatError` (carries HTTP status) so the UI can
  distinguish a 429 from other failures.
- `components/student/FloatingChat/`: `FloatingChatContext` (open/close,
  optional `topicId` + `seedMessage`) + `FloatingChatWidget` (button +
  panel). Mounted once in `app/(student)/layout.tsx`. The button reads the
  current topic ID from the URL via `useParams()` when present, so tapping
  it on a topic page "just works" without every page needing to call
  `openChat()` manually.
- History/messages are **not** persisted across close/reopen in this pass
  — each open re-fetches history for the given `topicId` (or general).
  Matches the brief's "reactive only for this iteration."

### "Why is this wrong?" hook

`PracticeQuestion.tsx` now takes an optional `topicId` prop (passed from
the topic page). When revealed and wrong, a button appears that opens the
floating chat with `topicId` + a `seedMessage` containing the question
text, the student's answer, and the correct answer — auto-sent the moment
the panel's history finishes loading (not left for the student to notice
and press send).

## Track B: notifications

### Toast library: `sonner`

Chosen because it's small, has no runtime dependencies beyond React,
handles stacking/positioning out of the box (relevant below), and is
widely used with Next.js App Router. Mounted once (`AppToaster`, in the
root layout) with `unstyled: true` + custom `classNames` mapped to the
app's existing design tokens (`bg-card`, `text-ink`, brand/danger border
accents) rather than sonner's default look.

`lib/toast.ts` wraps it as `toast.success/error/info` — deliberately not
exporting sonner directly, so call sites don't need to know which library
is behind it.

**Wired toasts**: topic completion (`toast.success`, topic page), recall
session complete (`toast.success`, recall session page), recall-rating
save failure (`toast.error`, previously silently swallowed), chat
send/rate-limit failure (`toast.error`, distinguishes 429 via `ChatError`),
payment verification failure (`toast.error`, pay/callback page).

Skipped by design: **payment initiation** failure (`/pay/individual`)
already has a persistent inline banner next to the form — a toast would be
redundant with an existing, arguably better-suited pattern for a
form-submission error. Flagging this as a deliberate choice, not a gap.

### Celebration overlay: custom, no library

`components/ui/celebration/` — `CelebrationContext` (mounted in the root
layout so it's available on both `(student)` and `(auth)` pages, since
payment success happens in `(auth)`) + `CelebrationOverlay`
(login/streak/payment variants). Animations are Tailwind `@layer
components` CSS keyframes in `globals.css` (`celebrationCardIn`,
`celebrationWiggle`, `celebrationPop`, `celebrationParticleFloat`) — no
`framer-motion` (it's in `package.json` but unused elsewhere; per the
brief's explicit ask, this stays CSS-only). Visual language matches
existing patterns: `bg-ink/40`-`/50` backdrop (same opacity family as the
existing logout-confirm sheet), `rounded-2xl bg-card shadow-xl` card, icon
in a `bg-ink` circle pill (same shape as the existing pay/callback success
screen's checkmark), `lucide-react` icons only (already a dependency).

- **Login**: `Hand` icon, wiggle animation, "Welcome back, {name}",
  auto-dismiss 1.8s. Triggered via a `sessionStorage` flag
  (`celebrate_login`) set by the login page right before
  `router.push('/student')`, read once by the student home page after its
  existing `getHomeData()` call resolves (which already has the display
  name — no second fetch needed just for a greeting).
- **Streak**: `Flame` + floating `Sparkle` particles, wiggle, "{N} day
  streak" / "You showed up N days in a row", auto-dismiss 2.5s.
- **Payment**: `CircleCheck` pop-in + particles (2s) → auto-transitions to
  a `Loader2` "Redirecting to registration…" phase (1s) → calls the
  caller's `onRedirect()`. No button at any point — matches "no tap
  required to advance."

**Overlap decision**: toasts and the celebration overlay are allowed to
co-occur (e.g., finishing a topic that's also the day's first activity —
completion toast + streak celebration near-simultaneously). They occupy
different screen regions (corner vs. centered) and don't visually collide,
so no sequencing was added. Flagging as a decision, not an oversight.

### Streak trigger — exact contract

`POST /topics/{topic_id}/activity` (the Part 1b engagement ping) now
returns:
```json
{ "ok": true, "streak_incremented_today": true, "streak_days": 4 }
```
`streak_incremented_today` is `true` only on the call that actually
recorded *today's first* activity row (via `INSERT ... ON CONFLICT DO
NOTHING ... RETURNING id` — `None` back means the row already existed).
The frontend (`pingTopicActivity` in `lib/api/topics.ts`, called from the
topic page) fires the celebration directly off this field — no dashboard
polling, no guessing. Live-verified: first ping today → `true` +
`streak_days: 1`; immediate second ping → `false`, same `streak_days`.

## Track B: payment → registration handoff

`verify_payment()` (`backend/app/api/v1/endpoints/payments.py`) now
includes `access_code` in its response, per the brief's exact snippet.

**Found and fixed a pre-existing, unrelated bug while wiring this same
response**: the frontend (`pay/callback/page.tsx`) checked
`if (!data.verified)` to decide success — but the backend response has
never had a `verified` field (it returns `{"status": "success", ...}`).
This meant `data.verified` was always `undefined`, so **every successful
individual payment was landing on the "Verification Failed" screen** in
the shipped code. Not something I could avoid touching — the whole
celebration-then-redirect sequence sits directly on top of this check, so
it had to be fixed for the new feature to ever run at all. Changed to
`data.status !== 'success'`. (Org payments have the same latent gap for
`org_name`/`admin_email` — those fields also don't exist in the backend
response yet, only papered over by a `sessionStorage` fallback for the
email. Out of scope here — only the individual flow's celebration/redirect
was requested — but flagging it since it's the same root issue.)

Full sequence now: successful individual `verify_payment` → celebration
(check-pop, "check your email") → 2s → "Redirecting…" → 1s →
`router.push('/register?code=' + accessCode)`. `register/page.tsx` reads
`?code=` via `useSearchParams()` (wrapped in `Suspense`, same pattern as
`login/page.tsx`'s existing `ResetSuccessBanner`) and sets it as
`useForm`'s `defaultValues.access_code`.

Not live-tested end-to-end — `PAYSTACK_SECRET_KEY` in the local backend
`.env` is a placeholder (`sk_test_xxxxx`), same constraint noted in the
earlier payment hotfix. Verified via `type-check`/`build` passing and the
same mocked-Paystack-call technique used to verify that hotfix, applied
here to confirm `access_code` round-trips correctly through
`verify_payment`'s response.

## Testing

Ran a real `uvicorn` backend (against the live Supabase DB, same
`teststudent` account used throughout this project) and a real `next dev`
frontend, driven with a headless Chromium via `playwright-core` (no
`chromium-cli` available in this environment — this is the noted fallback
from the `run` skill's `examples/electron.md`-style pattern). Actually
watched it work, not just read the code:

- **Login celebration**: fires ~2–2.5s after the `/student` redirect (real
  dashboard-fetch latency), visibly correct (waving hand, wiggle), and
  auto-dismissed after ~1.9s — matches the 1.8s target within normal
  `setTimeout` + polling granularity.
- **Floating button**: confirmed present on `/student`, `/student/progress`,
  `/student/recall`, `/student/settings`, `/student/learn`, and inside a
  topic's Def/Example/Visual/Practice steps.
- **General chat**: opened, sent a real message, got a real streamed Groq
  response; confirmed correct message ordering and that topic-scoped vs.
  general history stay in separate buckets across many accumulated
  messages from this session's testing.
- **Topic-context chat**: opened from inside a topic, confirmed it shows
  "Chatting about this topic" instead of "General study help."
- **"Why is this wrong?"**: answered a practice question wrong on purpose
  → button appeared (and did *not* appear on a correct answer, confirmed
  in an earlier pass) → opened chat pre-seeded with the exact question/
  wrong-answer/correct-answer text → auto-sent without needing to press
  send.
- **Topic completion toast**: confirmed present in the DOM right after
  finishing a topic's practice questions.
- **Streak celebration**: forced by clearing today's `daily_activity` row
  for `teststudent` and reopening a topic — flame icon, wiggle, sparkle
  particles, "1 day streak" text, all rendered correctly.
- **Rate-limit error toast**: forced the Redis counter to 50, sent a
  message, confirmed "Daily chat limit reached — Daily message limit
  reached (50/day)." toast rendered with the danger accent.
- **Console errors**: one recurring 404 across all screenshots, present
  before this session's changes too — matches the empty
  `public/manifest.json` icons array / empty `public/icons/` folder
  already flagged in `AUDIT_REPORT.md`'s Part 3 findings, not something
  introduced here.

**Not live-tested this pass**: recall-session-complete toast (no due
recall items available to complete in this session without more DB setup;
the underlying `submitRecallRating` flow was already thoroughly live-
verified end-to-end in the `feature/fix-progress-pipeline` work) and the
full payment→celebration→register handoff (no working Paystack sandbox
key, see above).

**Environment note**: `frontend/.env.local` (gitignored, not committed)
was completely missing `NEXT_PUBLIC_API_URL` — every other var in that
file at least had a placeholder line, this one didn't exist at all. Since
it's gitignored, this can't be fixed via a commit; flagging it because it
means the frontend currently can't reach ANY backend out of the box for a
fresh local checkout, which is worth the team knowing independent of this
feature.

## Gaps / follow-ups

- FloatingChat message state doesn't persist across close/reopen (refetches
  history each time) — acceptable for this pass per the brief's "reactive
  only" scope, but worth revisiting if usage shows people expect it to
  stay open.
- Org payment success screen's `org_name`/`admin_email` fields have the
  same "field doesn't exist in the response" gap as the bug fixed above —
  not fixed here (out of scope), flagged for a future pass.
- Streak milestone-only celebration (7/30/100 days vs. every day) —
  explicitly deferred per the brief, shipping "celebrate every day" first.
- Org-student login (`/mobile/code`, access-code-only, no username/password)
  doesn't trigger the login celebration — only the main `login/page.tsx`
  (individual students + would-be admins) was wired, for scope reasons.
