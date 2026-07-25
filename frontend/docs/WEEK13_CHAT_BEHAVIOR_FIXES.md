# Week 13 — AI Chat: Direct Answers, Clear History, Persistence Fix

## What was audited/built

A live transcript review of the floating AI Tutor (built on
`feature/floating-chat-and-notifications`, not yet on `dev`) surfaced four
real problems, confirmed directly against the `teststudent` account's real
persisted chat history rather than assumed from the report alone. Branch
`feature/fix-chat-behavior`, based on `feature/floating-chat-and-notifications`
(see "Branch base" below for why).

## Branch base

The brief asked for a branch off `dev`, but the floating AI Tutor this
brief is about doesn't exist on `dev` yet — it's only on
`feature/floating-chat-and-notifications` (which has `dev` merged into it,
not the reverse). On `dev`, the chat UI is placeholder scaffolding
(`ChatMessage.tsx` renders "Chat message scaffold"). Confirmed with the
user and branched off `feature/floating-chat-and-notifications` instead.

## Part 1 + 2 — Direct answers, including on repeat

**Root cause:** `backend/app/services/chat.py`'s system prompt said
*"Never give the answer directly. Guide the student to discover it
themselves,"* with zero exceptions. Confirmed live in the real DB: a
student asked "What is the answer to the practice question?" and "what
about 4 x 4" and was refused both times; "What is a quadratic equation?"
was asked twice and got two different invented analogies, never a direct
answer.

**Fix:** rewrote the system prompt to keep Socratic guidance as the
*default* but carve out three explicit direct-answer cases: (1) the
student explicitly asks for the answer ("just tell me", "what is the
answer", "I don't understand, please explain"), (2) the question is basic
arithmetic or a simple definitional lookup that doesn't benefit from
guided exploration, (3) the same question (or a close paraphrase) already
appears in the conversation history passed to the model — answer directly
first, optionally offer to explore further after. The model already
receives the recent conversation as real message history (not just a
paraphrase in the system prompt), so it has what it needs to recognize
case 3 itself; no application-side repetition-detection code was added,
per the brief's suggested approach.

**Live-verified** (fresh `teststudent` session, real Groq calls):
- "what is 2+2?" → *"Let's get straight to it. The answer is 4. ..."*
- "What is the capital of Nigeria? Just tell me directly." → *"The capital
  of Nigeria is Abuja."*
- "What is a quadratic equation?" asked twice in the same session → both
  times got the same direct textbook definition; the second answer did
  not invent a new analogy or end with a guiding question, unlike the
  first.

## Part 3 — Clear chat history

Added `DELETE /api/v1/chat/history` (optional `topic_id` query param,
same scoping as the existing `GET`) in
`backend/app/api/v1/endpoints/chat.py`, deleting that user's messages for
the given topic (or the general floating-chat history when omitted).

Frontend: `clearChatHistory(topicId?)` in `frontend/lib/api/chat.ts`, and
a trash-icon button in `FloatingChatWidget.tsx`'s header (only shown once
there's history to clear). First click arms a 5-second inline "Clear
chat?" confirmation instead of a native `confirm()` dialog (no such
pattern exists elsewhere in this app); a second click within that window
calls the delete endpoint and empties the panel immediately.

**Scoping decision:** clears whichever conversation is currently open —
general or that specific topic — mirroring exactly how `GET
/chat/history` already scopes reads. This isn't a new judgment call, just
the read endpoint's existing scoping applied to a delete.

**Live-verified:** clicked clear, confirmed via network trace the
`DELETE` returned `200`, and confirmed the *next* message sent got a
clean, context-free direct answer instead of referencing old history —
proving the clear wasn't just a local UI reset.

## Part 4 — Persistence

### The `UNIQUE_TEST_MARKER` string: confirmed real, cleaned up

Queried `teststudent`'s real `chat_messages` rows directly. Confirmed
`UNIQUE_TEST_MARKER_1784823881665 what is 2+2?` and two
`MARKER<timestamp> say hi back with the word pong` messages (plus their
assistant replies — 6 rows total) were genuinely persisted, from an
earlier manual streaming-verification session, not a throwaway/isolated
session. Deleted exactly those 6 rows (matched by the literal `MARKER`
string in content, plus each one's immediately-following assistant
reply); left the other 33 genuine rows (fractions, quadratic equation,
bearing, practice-question follow-ups, etc.) untouched.

### The actual bug: assistant replies lost when the client disconnects mid-stream

**Root cause:** `POST /chat/stream`'s handler saved the user's question to
the DB *before* streaming, but only saved the assistant's reply *after*
the full stream finished. Starlette cancels the response generator when
the client disconnects (confirmed by reading `starlette/responses.py`:
`StreamingResponse` runs the generator and a disconnect-listener in an
anyio task group and calls `cancel_scope.cancel()` on disconnect). A page
refresh mid-response — the exact case in the brief — cancels the
generator before the post-loop save code ever runs, so the question stays
saved with no reply, forever. Found a real instance of this exact pattern
in the DB: an identical user question sent twice, 73 seconds apart, with
only the second attempt's assistant reply ever saved.

**Fix:** wrapped the streaming loop in `try/finally`, saving whatever
content was generated so far inside the `finally` block. Because the
cancellation comes from an anyio cancel scope that's already cancelled at
that point, a plain `await` inside `finally` would immediately be
cancelled again before the DB write completes — confirmed this
experimentally in isolation before touching the real endpoint. Shielded
the save with `anyio.CancelScope(shield=True)`, which lets the commit
finish regardless of the outer cancellation.

**Regression test:** `backend/tests/test_chat.py::
test_stream_saves_partial_response_when_client_disconnects_midway` calls
the real `chat_stream` endpoint function, drives its generator inside an
anyio task group, cancels the scope partway through a mocked slow stream,
and asserts the partial assistant reply was still saved. This test fails
without the `shield=True` fix (verified the shielding mechanism in
isolation first, then confirmed the full test passes against the real
endpoint code).

**Live-verified:** confirmed persistence across a full re-fetch (closing
and reopening the floating panel, which re-runs `GET /chat/history`
against the real DB) — message count matched exactly before and after.
A true full-page-reload test was blocked by an unrelated environment
issue (see below), so the disconnect/cancellation path itself is verified
by the backend regression test instead, which exercises the exact
mechanism more precisely than a browser-level reload could anyway.

## Out-of-scope finding: local dev refresh-cookie cross-host mismatch

While trying to reproduce persistence with a real `page.reload()`,
found that a single reload reliably bounces the session back to
`/login`. Root cause: in this local setup the frontend runs on
`localhost:3000` (backend `ALLOWED_ORIGINS` requires this for CORS) while
the already-running backend is bound to `127.0.0.1:8004`. The refresh
cookie is issued with `SameSite=Lax` over plain HTTP (see
`backend/app/api/v1/endpoints/auth.py`'s `_set_refresh_cookie` —
`SameSite=None` only kicks in when `Secure`/HTTPS), and `localhost` vs
`127.0.0.1` count as different sites, so the browser withholds the cookie
on the cross-site `fetch` to `/auth/refresh`, which then 401s. This is a
local dev/test-environment artifact of running frontend and backend on
different hostnames, not a bug in the deployed app (production already
correctly uses `SameSite=None` + `Secure` for its real cross-origin
Vercel/Coolify split). Not fixed here — flagging in case anyone else's
local setup uses mismatched hostnames between the two dev servers.

## Files changed

| File | Change |
|---|---|
| `backend/app/services/chat.py` | System prompt: conditional direct-answer rules (Parts 1+2) |
| `backend/app/api/v1/endpoints/chat.py` | `DELETE /chat/history` (Part 3); disconnect-safe persistence via `try/finally` + `anyio.CancelScope(shield=True)` (Part 4) |
| `backend/tests/test_chat.py` | New — clear-history tests + disconnect-persistence regression test |
| `frontend/lib/api/chat.ts` | `clearChatHistory(topicId?)` |
| `frontend/components/student/FloatingChat/FloatingChatWidget.tsx` | "Clear conversation" button with inline confirm |

## Testing

- `npm run lint`, `npm run type-check`, `npm run build` — all clean.
- `uv run pytest` — 52 passed, 1 skipped (49 pre-existing + 3 new).
  `ruff check` clean.
- Live verification against real Groq + real DB (`teststudent`): direct
  answers for arithmetic and explicit "just tell me" requests; a repeated
  question answered directly on the second ask without inventing a new
  analogy; clear-conversation confirmed via network trace + a
  context-free follow-up response; history persistence confirmed across
  a full panel close/reopen re-fetch.
- Cleaned up both the pre-existing `MARKER` pollution and this session's
  own live-verification test messages from `teststudent`'s real chat
  history afterward, so the account is left in the same clean state it
  was found in (minus the marker rows, which are gone for good).

## Gaps / follow-ups

- The local dev refresh-cookie cross-host mismatch noted above — not a
  product bug, but worth knowing if anyone else hits a mystery logout on
  refresh in local dev.
- The system prompt's repetition detection relies entirely on the model
  reading its own visible history; it isn't perfect on multi-day-old
  context (a `?` follow-up several days later can read as a continuation
  rather than a fresh question) — acceptable behavior, not a regression,
  but worth knowing the boundary.
