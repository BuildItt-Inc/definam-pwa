# Week 15 — Deduplicate Subjects, Fix Nav Bug, Link School Admin Login

## What was audited/built

Three independent fixes on `feature/fix-subject-display-and-nav` (based on
`dev`), ahead of the bigger dashboard/redesign work.

## Part 1 — One subject card per name, chapters grouped by class level

### Problem

The class-level seeding fix created 2–3 `Subject` rows per name (one per
SS1/SS2/SS3), and the Browse page rendered one card per row — "Mathematics"
three times, etc.

### Approach: server-side grouping (recommended, chosen)

`GET /subjects` now groups by `Subject.name` in SQL
(`backend/app/db/database.py`'s `get_all_subjects`), summing
`chapter_count`/`topic_count` across every class-level row sharing that
name. A grouped subject has no single underlying row id, so the response
shape dropped `id`/`class_level` entirely — `name` is the key the frontend
uses for both the React list key and the chapters lookup.

Fetching chapters is now by name, not by a single subject id: added
`GET /subjects/by-name/{name}/chapters`
(`get_chapters_by_subject_name`), which joins every `Subject` row sharing
that name, returns their chapters annotated with `class_level`, sorted
`SS1, SS2, SS3` then `chapter_num` within each level (string sort works
correctly here — same length, same "SS" prefix). The old id-based
`GET /subjects/{subject_id}/chapters` endpoint was replaced rather than
kept alongside it — nothing else referenced it.

`ChaptersView` (`frontend/app/(student)/student/learn/[topicId]/page.tsx`)
now groups the returned chapters into SS1/SS2/SS3 buckets client-side (a
fixed display order, filtering out empty levels) and renders each under
its own section header, rather than flattening — so each level's own
"Chapter 1" reads as belonging to that level, not as a duplicate of
another level's chapter. This also fixed a pre-existing bug where the
header was **hardcoded to always say "SS2 Syllabus"** regardless of which
subject or level was actually open.

### Files changed

| File | Change |
|---|---|
| `backend/app/db/database.py` | `get_all_subjects` groups by name; `get_chapters_by_subject` → `get_chapters_by_subject_name`, annotated with `class_level` |
| `backend/app/api/v1/endpoints/learning.py` | `/subjects/{subject_id}/chapters` → `/subjects/by-name/{subject_name}/chapters` |
| `frontend/types/topics.ts` | `Subject` drops `id`; `Chapter` gains `class_level` |
| `frontend/lib/api/topics.ts` | `getChapters(subjectId)` → `getChaptersBySubjectName(name)` |
| `frontend/lib/api/mock/data.ts` | Updated to match (dead code — `USE_MOCK` is `false` — kept type-consistent only) |
| `frontend/app/(student)/student/learn/page.tsx` | Browse cards keyed/linked by `subject.name` |
| `frontend/app/(student)/student/learn/[topicId]/page.tsx` | `ChaptersView` fetches by name, groups by `class_level` under section headers, fixes the hardcoded "SS2" bug |
| `backend/tests/test_learning.py` | New — grouping and class-level annotation regression tests |

### Live-verified

Logged in as `teststudent`: Browse shows exactly 5 cards (Mathematics,
English Language, Chemistry, Physics, Economics), each with a correctly
summed chapter count (e.g. Mathematics: 34 chapters · 270 topics — SS1 12
+ SS2 10 + SS3 12). Drilling into Mathematics shows three clearly labeled
section headers ("SS1 · 12 chapters", "SS2 · 10 chapters", "SS3 · 12
chapters") each with their own chapters; drilling into a chapter still
reaches the topics view correctly.

## Part 2 — Bottom nav "jumping" on scroll

### Confirmed root cause

`app/globals.css`'s `.page-enter` entrance animation:

```css
.page-enter {
  animation: pageEnter 250ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Both keyframes specify a `transform` — including the resting `to` state
(`translateY(0)`). Per spec, **any element with a specified `transform`,
even one that resolves to the identity transform, becomes the containing
block for its `position: fixed` descendants** — not just during the
animation, permanently for as long as the class is applied. Every student
page wraps its content in `<div className="page-with-nav ... page-enter">`
and previously rendered `<BottomNav />` as the last child *inside* that
same div, so the nav was never actually fixed to the viewport — it was
fixed relative to that wrapper, which also has `overflow-y: auto`
(`.page-with-nav`), producing exactly the observed symptom: pinned
correctly on first paint, then rides along/settles mid-page once the
wrapper scrolls.

This affected every student page using `page-with-nav` + `page-enter`
together (Home, Browse, Progress, Review, Settings) — not just Browse,
though Browse was the one explicitly reported.

### Fix: portal `BottomNav` to `document.body`

Considered the brief's preferred approach (move `<BottomNav />` to render
as a JSX sibling of each wrapper, in the relevant layout file) but two
things ruled it out:

- Centralizing it in `(student)/layout.tsx` would put the nav on the
  full-screen 5-step learning flow too (`learn/[topicId]/page.tsx`'s
  `view`-less "detail view"), which deliberately never showed it — that
  page's wrapper doesn't even use `page-enter`, so it was never broken by
  this bug, and giving it a nav it never had would be a real regression,
  not a fix.
- Manually restructuring each of the 5 affected pages' JSX into a
  `<>...</>` sibling pair works but is easy to get subtly wrong per page
  and doesn't address the underlying fragility — any *future* page using
  `page-with-nav`/`page-enter` would reintroduce the exact same bug.

Instead, `BottomNav` (`components/student/BottomNav.tsx`) now renders
itself via `createPortal(nav, document.body)`. This changes *where in the
DOM* it physically attaches — always a direct child of `<body>`,
regardless of which page calls it or how deeply nested/transformed that
page's own wrapper is — without changing *which* pages call it. No page
files needed any changes at all; the fix is entirely inside the one
component. A `mounted` guard (`useState` + `useEffect`) avoids a
server/client render mismatch, since `document.body` doesn't exist during
SSR.

Not a `position: fixed !important` band-aid — this addresses the actual
containing-block problem (which element the nav is anchored to), per the
brief's explicit instruction not to paper over it.

### Live-verified

`document.querySelector('nav').parentElement.tagName === 'BODY'` after
the fix (was previously nested inside the page wrapper). On the Browse
page, `nav.getBoundingClientRect().bottom` stayed exactly equal to
`window.innerHeight` both before and after scrolling the list — confirmed
via a real scroll (`mouse.wheel`), not just a static check. Verified
visually via screenshots on Browse and the chapters-drill-in view; the
`page-enter` fade/slide-up animation itself still looks the same since
its CSS wasn't touched, only where the nav renders.

## Part 3 — Link the school admin login from the landing page

The landing page (`frontend/app/page.tsx`) already had a "For schools"
link, but it pointed to `/pay/organisation` (the purchase flow) — correct
for a prospective school buying access, but no help to an *already
registered* admin trying to log in. There was genuinely no link to
`/admin/login` anywhere.

Added a distinctly-labeled **"School admin login"** link (not reusing "For
schools", to avoid two identically-labeled links pointing to different
destinations) pointing to `/admin/login`:
- Header nav, next to "Sign in" (`hidden sm:block`, matching the existing
  "How it works" link's responsive pattern — desktop only).
- Footer nav, next to the existing "For schools" link (visible on mobile,
  since the header copy is desktop-only).

### Live-verified

Both links present in the DOM; clicked the footer link and confirmed
navigation to `/admin/login`, which renders the real "School Admin Login"
form.

## Testing

- `uv run pytest` — 54 passed, 1 skipped (51 pre-existing + 3 new).
  `ruff check` clean.
- `npm run lint`, `npm run type-check`, `npm run build` — all clean.
- Live verification (Playwright, real backend + `teststudent` account):
  Browse card count/grouping, chapter section headers, nav portal +
  scroll-pinning, and the admin-login link — all confirmed as described
  above.

## Gaps / follow-ups

- None identified beyond the pre-existing `pb-nav` Tailwind class being a
  no-op (no `nav` spacing key registered in `tailwind.config.ts`) —
  unrelated to this task's scope (that's page-content bottom padding, not
  the containing-block bug), noticed while reading `globals.css` but not
  touched.
