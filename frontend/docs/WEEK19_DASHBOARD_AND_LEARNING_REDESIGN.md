# Week 19 — Dashboard and Learning Interface Redesign

## What was audited/built

Implemented both redesigns on `feature/dashboard-and-learning-redesign`
(based on `dev`), matching two approved static HTML previews provided
directly alongside the brief (same pattern as the landing page task —
the attachments didn't come through on the first message, provided when
asked).

## Part 1 — Dashboard (`app/(student)/student/page.tsx`)

- **Header:** `linear-gradient(160deg, #111827 0%, #16321F 130%)` with a
  fixed radial green glow in the top-right corner (a static accent, not
  the cursor-tracked spotlight used elsewhere — matches the preview's
  `.header-glow`, which doesn't track the pointer).
- **Streak pill:** unchanged data/logic, flame icon now uses a
  `flame-pulse` scale animation (`globals.css`) instead of sitting still.
- **NEW: completion ring.** See "Overall completion" below — this is the
  one genuinely new piece of data on this page.
- **NEW: subject strip.** Tappable (chose tappable per the brief's own
  recommendation) — each chip links straight to that subject's chapter
  list (`/student/learn/{name}?view=chapters&name={name}`, the same
  pattern Browse already uses). Backed by a new call to the existing
  `getSubjects()` (same endpoint Browse calls) — not a new backend
  endpoint, just a second consumer of one that already existed.
- **NEW: stats row.** Subject count (from that same `getSubjects()`
  call), the most-recent topic's progress + name, and streak days — all
  already-available data, no new fields needed beyond the completion
  percent.
- **Recall card + topic rows:** both now use the `useSpotlight` hook and
  `.spotlight`/`.spotlight-card` classes built during the landing page
  work, per the brief's explicit "reuse... don't reinvent" instruction.
- **Topic rows:** real per-topic progress bar (`mastery_percent`) and a
  subject-colored icon background. Behavior change from before: each row
  now shows its own "Continue"/"Start" state based on **that topic's own
  progress**, rather than one page-wide flag applied uniformly to every
  row (the previous code computed a single `hasStarted` boolean from
  "does *any* recent topic have progress" and applied it to *all* rows).
  Matches the preview, where "Fractions" (50%) shows "Continue" while
  "Acids & Bases" (0%) shows "Start" side by side. The page-level
  "Continue studying" vs "Start here" section title is unchanged.

### Overall completion — new metric, checked before inventing it

Checked `students.py`'s `/dashboard` and `/progress` endpoints first, as
the brief asked — neither computes anything like this today. Added it to
`/dashboard`: distinct topics the student has at least one `TopicReview`
for, divided by every published topic in the curriculum (`Topic.status
== "published"`), rounped to the nearest percent. Extracted as
`_compute_completion_percent(topics_studied, total_topics)`, mirroring
the existing `_compute_streak` pattern in the same file, so it's unit
testable without mocking the whole endpoint (`backend/tests/test_students.py`,
5 tests: normal case, zero, 100%, division-by-zero guard, rounding).

**Live-verified against the real `teststudent` account and the real DB:**
`topics_studied=1, total_topics=1277` → `0%` (0.078% rounds down) — the
UI's completion ring showed exactly `0%`, confirmed by querying the same
numbers directly against Postgres. Not a bug: with 1,277 total topics,
any student who has only engaged with a handful will show 0% for a long
time. Worth knowing as a real characteristic of this metric at the
current curriculum scale, not something this task's scope covers
changing (see Gaps below).

### Shared subject icon/color mapping

`SUBJECT_ICONS` previously existed as a local copy in both
`SubjectCard.tsx` and this page. Since the brief needed a *color*
mapping too (topic-row icon backgrounds) and none existed yet,
consolidated both into one new `lib/utils/subjects.ts` and updated
`SubjectCard.tsx` to import from it instead of keeping its own copy —
directly per the brief's "reuse... or establish one consistently if it
doesn't exist."

## Part 2 — Learning interface (`app/(student)/student/learn/[topicId]/page.tsx`)

- **Header (`LearningTopBar`):** same gradient as the dashboard. Kept the
  exact existing structure (back button, title, exit, 5-segment progress
  bar, step labels) — segment "done" color changed from white to brand
  green and the literal `✓` character replaced with a small check icon;
  no logic changed.
- **Content cards (`LearningStep.tsx`):** unified all three steps onto the
  same spotlight-hover card style (previously each step had a different
  background treatment — plain card, brand gradient, plain white). The
  step-2 "Nigerian Context" tag moved from the header row into the card
  itself, matching the preview's in-card tag placement. **All internal
  content-rendering logic — every `MathContent` call, the step-3
  tree-marker line-splitting regex — is byte-for-byte unchanged**; only
  the outer wrapper `className`s changed. Verified this directly: grepped
  `MathContent` occurrence counts against `origin/dev` for both this file
  and `PracticeQuestion.tsx` before and after — identical counts.
- **Step transitions:** implemented with `framer-motion` (already a
  project dependency, already has a `lib/motion.ts` convention file) —
  added a `stepSlide` variant there rather than hand-rolling CSS
  transitions. A `direction` state (+1 advancing, -1 back) is set right
  before every `setStep` call; `AnimatePresence` + a `motion.div` keyed on
  `` `${step}-${questionIndex}-${showScoreSummary}` `` handles the
  exit/enter crossfade so it covers step 1→2→3, practice question-to-
  question, and the score summary transition consistently, not just the
  three content steps. Duration is 320ms, inside the requested
  300-350ms range. Live-verified by screenshotting mid-animation (not
  just before/after) — genuinely caught the outgoing content fading/
  translated mid-flight.
- **Practice step:** the existing `PracticeQuestion.tsx` already
  implemented immediate correct/wrong feedback with no artificial delay
  before this task — that requirement was already met. Only restyled the
  outer question-card wrapper to the same spotlight-card treatment;
  the option-selection state machine (`selected`, `revealed`,
  `isCorrectOpt`, etc.) is untouched.
- **Chat step (`AITutorScaffold`):** restyled its header only (same
  gradient), exactly as scoped — did not touch its message rendering,
  streaming logic, or state.

### Found but explicitly out of scope: `AITutorScaffold`'s own gaps

Confirmed again (this was already flagged in
`WEEK17_CHAT_THINKING_FIX_AND_REDESIGN.md`) that this component has its
own separate `isLoading`-overlap bug and renders messages as raw text
instead of through `MathContent`. The brief explicitly named this file
as "flagged separately... NOT in scope for this brief," so only its
header was touched.

## Testing

- `uv run pytest` — 59 passed, 1 skipped (54 pre-existing + 5 new).
  `ruff check` clean.
- `npm run lint`, `npm run type-check`, `npm run build` — all clean.
- Live verification (Playwright, real backend + `teststudent`, real
  content):
  - Completion ring's `0%` cross-checked against a direct DB query —
    mathematically correct, not a placeholder.
  - Subject strip: 5 chips, correct titles, click-through navigation to
    the right subject's chapter list confirmed.
  - Stats row showed real subject count (5), real current-topic progress
    (50%, Fractions), real streak (1 day).
  - Topic row spotlight hover confirmed via screenshot.
  - Learning flow: screenshotted step 1 (Simple Definition, 18 KaTeX
    elements rendered — real fractions, not placeholder text),
    mid-transition to step 2 (caught the actual slide/fade in progress),
    step 2 (Nigerian Example, 15 KaTeX elements, including the
    multi-step "STEP 2/3/4/5" worked-example formatting still parsing
    correctly), step 4 practice question (fractions rendered in both the
    question and all four options), and immediate correct-answer
    feedback (green highlight + checkmark + KaTeX-rendered explanation,
    appearing the instant an option was clicked).

## Gaps / follow-ups

- The completion ring will read 0% for the large majority of real
  students for a long time, given 1,277 total topics versus realistic
  early engagement — correct as specified, but worth knowing if the
  product wants a more encouraging framing later (e.g. scoping the
  denominator to a student's actively-studied subjects rather than the
  entire curriculum).
- `AITutorScaffold`'s own thinking-overlap bug and missing `MathContent`
  usage remain unaddressed, as scoped.
