# Week 10 (cont.) — Practice Question Rendering Follow-up

## What was audited/built

Follow-up to `WEEK10_MATH_CONTENT_RENDERING.md`. Two symptoms were reported
on the live deployment's Practice Question tab (Step 4): the question stem
showing raw `$...$` text, and the answer options showing raw `$...$` text
despite already being wrapped in `MathContent`.

## Files changed

| File | Change |
|---|---|
| `components/student/PracticeQuestion.tsx` | Question stem was rendered as a plain `<p>{question.question}</p>` — never passed through `MathContent` at all. Wrapped it in `MathContent` (`allowBlock={false}`), matching how options and the explanation are already rendered. |

## Confirmed and fixed

The question-stem bug is straightforward: it was simply never wired up to
`MathContent`, unlike options/explanation. Fixed and build/lint verified.

## Investigated but NOT resolved: options still raw

I was not able to reach a confirmed root cause for the options symptom, and
did not make speculative changes to work around it. Here's what the
investigation ruled in/out, and what's blocking a conclusive answer.

**Ruled out: hydration timing.** The theory was that `MathContent` briefly
shows raw text before `window.katex` becomes available. Tracing the actual
navigation flow in `LearningFlow` (`app/(student)/student/learn/[topicId]/page.tsx`):
`step` is component state (`useState(1)`), not synced to the URL, so the
Practice tab (step 4) is only reachable by first rendering steps 1–3 in the
same page session — steps already confirmed to render correctly with KaTeX.
By the time step 4 mounts, `window.katex` has already been loaded and used
successfully at least three times on the same page. There's no code path
that lands a fresh page load directly on step 4. This makes a timing race
very unlikely for the normal in-app flow (it would still apply if someone
force-reloaded the browser while on step 4, but that resets `step` to 1, not
to 4). I'm fairly confident this isn't the explanation, but can't rule it out
with 100% certainty without watching it happen live.

**Checked and clean:**
- `practice_questions` is a proper `JSON` column
  (`backend/app/db/models.py`) — SQLAlchemy returns it as native Python
  list/dict, not a string needing a second parse. No double-encoding in
  `database.get_topic_by_id` / `update_topic_content`.
- The API response shape in `backend/app/api/v1/endpoints/learning.py`
  (`GET /topics/{topic_id}`) passes `practice_questions` straight through
  with no transformation.
- `USE_MOCK` in `frontend/lib/api/mock/week2.ts` is hardcoded `false`, so
  the frontend mock layer (which — unrelated aside — has mojibake unicode
  math symbols in its own practice-question fixtures, e.g. `xÂ² âˆ’ 5x` in
  `lib/api/mock/data.ts`) isn't in play in production.
- `MathContent`'s regex/rendering logic itself was re-checked against
  standalone strings equivalent to a single option (e.g. `"$CuSO_4(s)$"`
  with no surrounding prose) — nothing about being a short, math-only string
  breaks the matching logic differently from the already-fixed steps 1–3
  content.

**Real fragility found, but unconfirmed as *the* cause:**
`generate_groq_questions` / `generate_gemini_questions` in
`backend/app/services/content_generator.py` do a bare `json.loads(text)` on
raw LLM output with no repair/escaping safety net (lines ~158, ~208). The
prompt (`PROMPT_QUESTIONS`) asks the model to emit LaTeX like `\frac{x}{2}`
inside a JSON string, which is only valid JSON if the model correctly
double-escapes the backslash as `\\frac`. LLMs are inconsistent about this.
If `json.loads` throws, the `except` block logs and falls back to
`get_fallback_content(title)["practice_questions"]` — generic template
questions with clean `$` math, not garbled ones — so a parse failure alone
doesn't explain literal `$...$` reaching the screen. This is worth hardening
regardless (e.g. validate/repair the JSON, or ask the model for base64/plain
text math instead of raw backslashes in JSON), but I can't confirm it's
connected to the specific screenshot without seeing the actual stored
string.

## Why this wasn't fixed blind

Every plausible code-level explanation I could construct for "options show
literal `$...$` despite going through the same, already-fixed `MathContent`
path that steps 1–3 use successfully" requires seeing the actual stored
`question.options` value for the reported question (Preparation of Salts —
the Mama Ngozi / copper(II) sulfate question) to distinguish between:
content that's genuinely malformed at the source (unbalanced `$`, unusual
LaTeX like `\ce{}` chemistry macros that core KaTeX — no mhchem plugin is
loaded in `app/layout.tsx` — can't parse) vs. some other timing/render path
I haven't found. I don't have access to `frontend/.env.local` with real
keys, the live Vercel deployment, or its DevTools network tab, so I can't
pull that response myself.

## Needs from the team to close this out

Either of:
1. The raw `question`/`options` JSON for the reported question (DevTools →
   Network → the `/topics/{id}` call), pasted back, or
2. Real Supabase/API keys in `frontend/.env.local` so `npm run dev` can hit
   the live backend and I can inspect it directly.

## Gaps / follow-ups

- `npm run lint` and `npm run build` pass with the stem fix.
- Options bug is still open — see above.
- Unrelated mojibake found in `frontend/lib/api/mock/data.ts` practice
  question fixtures (not in the live path since `USE_MOCK = false`, so not
  touched here — flagging in case the mock layer gets reactivated for
  local dev/testing).
