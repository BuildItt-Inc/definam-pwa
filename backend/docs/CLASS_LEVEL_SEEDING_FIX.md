# Class-Level Seeding Fix — SS1/SS2/SS3

## What was wrong

`backend/scripts/generate_curriculum_structure.py`'s `seed_curriculum()`
looked up an existing `Subject` by `name` only:
```python
select(Subject).where(Subject.name == sub_def["name"])
```
`class_level` exists on the model (`# SS1, SS2, SS3`) but was never part of
the dedup key, and there was no DB-level constraint to catch this either.
Every subject in the live DB was seeded as `class_level="SS2"` only (5
subjects, verified directly against the DB before making any change).
Naively adding SS1/SS3 would have found the existing SS2 row by name alone
and attached mismatched-level chapters onto it.

## What changed

### Part 1 — Fix the dedup key + add a real constraint

- Subject lookup now keys on `(name, class_level)`.
- New migration `ed0e166f16b6_add_unique_constraint_subject_name_.py`
  adds `uq_subjects_name_class_level`, a real unique constraint on
  `(name, class_level)`. The migration checks for existing duplicates
  first and raises with the offending rows if any exist, rather than
  assuming it's safe — confirmed none existed before applying it.
- **Verified the constraint actually rejects a duplicate**, not just that
  the migration ran: inserted a second `('Mathematics', 'SS2')` row
  directly via the ORM and got a real `UniqueViolationError` back
  referencing `uq_subjects_name_class_level`. Also confirmed the
  constraint does *not* over-block: `('SomeSubject', 'SS1')` and
  `('SomeSubject', 'SS3')` both inserted fine (same name, different
  level).

### Part 2 — Actually seed all three levels

- `CLASS_LEVELS = ["SS1", "SS2", "SS3"]`, looped for every subject.
- `generate_subject_curriculum()` now takes `class_level` and
  `PROMPT_TEMPLATE` asks explicitly for "the portion of the WAEC syllabus
  typically taught at {class_level} specifically — not the full
  three-year SS1-SS3 span, and not content that properly belongs to an
  earlier or later year," rather than the old prompt's "SS1-SS3" blend.
- Fallback behavior, per spec: AI failure + `class_level == "SS2"` → use
  the existing hand-authored `FALLBACK_CURRICULUM` (authored with SS2 in
  mind). AI failure + SS1/SS3 → log a clear warning and skip that
  combination entirely this run, rather than reusing SS2 fallback content
  mislabeled as a different year.

## Testing — all done live against the actual Supabase DB

1. **Fresh run, three distinct rows per subject**: ran the script for
   real. All 15 subject × class-level combinations succeeded via AI
   (Gemini first, Groq fallback once Gemini's daily free-tier quota ran
   out partway through — visible in the run, not a failure of the script).
   Confirmed via direct DB query: 15 `Subject` rows, 3 per name, each with
   its own distinct chapter/topic counts (e.g. Chemistry: SS1 has 14
   chapters/72 topics, SS2 has 12/57, SS3 has 12/47 — genuinely different
   content per level, not shared).
2. **Idempotency**: ran the script a second time immediately after.
   Result: `0 new subjects` (confirmed no duplicate `Subject` rows —
   the actual bug this PR fixes). Note: chapter/topic counts *did* grow
   slightly on the second run (5 new chapters, 495 new topics) — this is
   a **pre-existing** characteristic of the script unrelated to this fix:
   AI generation is non-deterministic (`temperature=0.3`), so a second run
   can produce a slightly different chapter/topic breakdown, and the
   script has no pruning logic (it only ever adds chapters/topics that
   don't already exist by `chapter_num`/`title`, never removes stale
   ones). Flagging this as a known, separate characteristic — not
   something this PR's scope covers fixing.
3. **Constraint rejection**: see above — tested directly, not assumed.
4. **SS1 vs SS3 content quality spot check**: Mathematics SS1 opens with
   "Introduction to Algebra," "Angles and Shapes," "Measurements" —
   clearly foundational. Mathematics SS3 has "Coordinate Geometry,"
   "Probability" — no "Introduction to" framing, more consolidated.
   Chemistry SS1 starts "Introduction to Chemistry," "Chemical Reactions."
   Chemistry SS3 is "Introduction to Organic Chemistry," "Isomerism,"
   "Alkenes and Alkynes," "Aromatic Chemistry" — genuinely advanced,
   final-year organic chemistry, not a reshuffled copy of SS1/SS2.
   Read as plausible, differentiated content, not hallucinated or
   copy-pasted.
5. **Graceful skip when AI fails and no fallback exists**: not exercised
   live (AI succeeded for all 15 real combinations this run — Gemini's
   quota ran out but Groq covered every fallback case, so the "AI failed
   entirely" branch never triggered against the real DB). Verified the
   branching logic directly instead: mocked `generate_subject_curriculum`
   to always return `None` and ran the same loop logic in isolation —
   confirmed SS2 correctly falls back to `FALLBACK_CURRICULUM`, and SS1/SS3
   are correctly skipped (never appear in what would be written to the
   DB), rather than raising (there is no SS1/SS3 entry in
   `FALLBACK_CURRICULUM` to find) or silently reusing SS2 content.
6. `uv run pytest`: 46 passed. `ruff check`: clean. No existing test
   coverage exists for this script specifically (nor did before this
   change) — verification here is the live-DB testing above, matching how
   the repo's other seed scripts (`create_test_admin.py`,
   `seed_curriculum_content.py`, etc.) are verified.

## Final subject/class-level matrix seeded

15 `Subject` rows: Mathematics, English Language, Chemistry, Physics,
Economics — each × SS1/SS2/SS3. All via live AI generation this run (no
combination fell back to the hand-authored `FALLBACK_CURRICULUM` or was
skipped, since AI generation succeeded for every combination).

## Flagging back, per the brief: frontend has no concept of class level at all

Confirmed by direct code search (`class_level`/`classLevel`: zero matches
anywhere in `frontend/`), even though the backend already returns it —
`get_all_subjects()` in `database.py` has included `class_level` in its
response dict all along, this was never a backend gap.

**The gap is bigger than a missing filter — there's no data model for it
on the student side either.** `User` (`app/db/models.py`) has no
`class_level` (or equivalent) column at all. There is currently no way for
a student's account to record which class they're in. `ChaptersView` in
`frontend/app/(student)/student/learn/[topicId]/page.tsx` even hardcodes
the literal string `"SS2 Syllabus"` in its UI copy, unconditionally.

**Concretely, as of this PR merging**: `/student/learn` (the Browse tab)
fetches and flatly renders every `Subject` row with no grouping or
filtering by level. A student will now see 15 subject cards instead of 5,
including **three identically-named "Mathematics" cards** with nothing
distinguishing them (same name, no level shown anywhere in the card UI).
This is a real, visible regression for any student using Browse the
moment this seeding change ships, not a cosmetic gap.

This needs a product decision before (or alongside) a frontend fix, not a
unilateral engineering guess: does a student's account know their class
level at all today (and if not, where would that come from — asked at
registration? Inferred from something else? A settings-page selector
added later?), and should Browse filter to just the student's level, show
a level switcher, or something else entirely. Flagging this back per the
brief's explicit instruction rather than guessing an implementation.
