# Week 18 — Full Landing Page Redesign (Matching Approved Preview)

## What was audited/built

Implemented the full landing page redesign on `feature/landing-page-redesign`
(based on `dev`), matching an approved static HTML preview provided directly
alongside the brief. Only the "School admin login" nav link from the earlier
preview iteration had actually shipped before this — the full visual
redesign itself was net-new.

## Judgment calls flagged per the brief's own request

### 1. "Review it later," not "Recall it later"

The preview's third "How it works" step was titled "Recall it later." The
in-app spaced-repetition feature was deliberately renamed from "Recall" to
"Review" in an earlier task (`WEEK15_SUBJECT_DEDUP_AND_NAV_FIX.md`),
specifically to resolve a naming collision with the app itself being called
Recall. Using "Recall it later" here would reintroduce that exact
collision on the page most likely to be a new visitor's first impression.
Changed the copy to "Review it later" throughout that step. Flagged here
per the brief's explicit request rather than picked silently.

### 2. Schools band CTA routes to `/pay/organisation`, not `/admin/login`

The brief asked me to check current behavior and "keep consistent with
whatever the recently shipped admin link does" for the schools band's CTA
button. Checking the current `/admin/login` page found it has **no link
back to the purchase flow at all** — it's a bare login form. Following the
brief literally (routing the schools band, the nav's "For Schools" button,
*and* the footer all to `/admin/login`, combined with the brief's own
"simple footer, no links" spec dropping the current footer's only path to
`/pay/organisation`) would have left a brand-new prospective school with
**no discoverable way to reach the actual purchase flow from this page at
all**.

Raised this explicitly rather than guessing either direction. Resolved:
- Nav "For Schools" button and mobile menu link → `/admin/login` (matches
  the brief exactly — this is for existing admins who already know to look
  for a login link).
- Schools band CTA ("Talk to us about school access") → `/pay/organisation`
  (the schools band is explicitly a conversion pitch aimed at prospects
  without an account yet).

## Data sourcing (per the brief's explicit instruction to verify, not reuse preview placeholders)

Queried the live database directly via `get_all_subjects()`
(`backend/app/db/database.py`) rather than reusing the preview's
placeholder figures (12+ subjects / 100+ topics) or its fictional
11-subject pill list (which included Biology, Government, Financial
Accounting, Commerce, Literature in English, Geography — none of which
are actually seeded yet).

**Real result at implementation time (2026-07-25):**

| Subject | Chapters | Topics |
|---|---|---|
| Mathematics | 34 | 270 |
| English Language | 36 | 243 |
| Chemistry | 41 | 306 |
| Physics | 36 | 258 |
| Economics | 32 | 200 |
| **Total** | **179** | **1,277** |

Used in the page:
- **Subjects section:** all 5 real subjects, no "and more" — the full list
  isn't long enough to warrant truncating.
- **Stats strip:** "5 subjects covered" (exact count) and "1,200+ topics
  and growing" (a true floor below the real 1,277, so it won't go stale
  the moment a topic is added — deliberately not the exact 1,277, which
  would need updating on every content addition).

These are **hardcoded**, not a live API integration — this is a static
marketing page, and the brief's own phrasing ("confirm... before
hardcoding") expected that. If the subject lineup changes materially,
these need a manual update; there's no automatic sync.

## Architecture

- `app/page.tsx` — Server Component, holds `metadata`/`viewport` exports
  (required to be server-side; can't coexist with `'use client'` in the
  same file) and renders `<LandingPage />`.
- `components/landing/LandingPage.tsx` — `'use client'`, the entire
  interactive page body (nav, hero, all sections). Loads Space Mono via
  `next/font/google` (weights 400/700, normal + italic, matching the
  preview's Google Fonts import) scoped to just this page.
- `hooks/useSpotlight.ts` — the cursor-tracked spotlight hover effect
  (radial gradient following the pointer via `--x`/`--y` CSS custom
  properties, set on `mousemove`), used by every bordered/filled nav
  button, every "How it works" card, and the pricing card, per the
  brief's "reuse this exact pattern everywhere" instruction. Paired with
  `.spotlight`/`.spotlight-filled`/`.spotlight-card` classes in
  `globals.css`.
- `components/landing/FloatingSymbols.tsx` — the drifting chemistry/physics
  notation. Declared as a static array (not the preview's runtime
  DOM-generation) so server and client render identically; each item gets
  its own drift variant and duration so the cluster doesn't move in sync.
- `components/landing/RunningCharacter.tsx` — the looping runner, kept as
  its own component so it's a single JSX line to remove or adjust, per
  the brief ("make it easy to toggle off"). Hidden below `sm:` — at
  narrow widths it competed with the headline for very little payoff.
- `components/landing/LandingBrandMark.tsx` — the new gradient badge +
  R-monogram-with-brain-cap icon, **landing-page-scoped only**. Left the
  shared `components/landing/LogoMark.tsx` (used on login, register, and
  the existing `MobileNav`) untouched, since the brief frames this new
  mark as "a placeholder direction, not final production art" for this
  specific redesign, not a global brand refresh.
- `components/landing/MobileNav.tsx` — **rewrote** the existing (already
  fully built, but unused) hamburger-menu overlay to match the new dark
  theme and the resolved link destinations above, rather than building a
  new one from scratch. This is the brief's recommended improvement over
  the preview's own mobile handling (which just hid the "How it works"
  link at narrow widths, per its comment `/* saves space; still reachable
  via footer or a menu in the real build */`) — implemented as the
  suggestion anticipated.
- `app/globals.css` — added the spotlight CSS, the diagonal drift
  keyframes (`landingDriftA`/`landingDriftB`), and the runner's keyframes,
  plus the mobile rule that hides floating symbols past the 5th and dims
  the rest (`.landing-float-item:nth-child(n + 6)`).

## Deviations from the preview

- **Footer:** dropped the preview's literal placeholder text ("Preview
  only, not final copy or pricing") — that line was clearly meta-commentary
  about the mockup file itself, not real product copy. Wrote "Recall. A
  modern study platform for Nigerian secondary school students." instead,
  matching the brief's "simple, brand name, one line about the platform"
  spec, and kept the existing site's copyright line.
- **Metadata title:** the preview's HTML `<title>` wasn't part of the
  brief's copy requirements, so I wrote new page `<title>`/OG metadata
  consistent with the new headline. Caught and fixed one em dash in an
  early draft of this title during the final compliance grep (see below)
  — not from the preview itself, introduced while writing the metadata.
- **Icons:** inlined the preview's exact hand-coded SVG paths rather than
  substituting lucide-react equivalents, per the brief ("implement close
  to the preview's SVG… don't over-invest polishing further") — this
  keeps proportions identical to what was approved rather than
  introducing subtle differences from a different icon set.

## Testing

- Live-verified (Playwright, real dev server, both 1280px desktop and
  375px mobile viewports):
  - Nav "For Schools" → `/admin/login`, "Sign in" → `/login`, "Get
    started" → `/pay/individual` — confirmed on both desktop nav and the
    mobile hamburger menu, including an actual click-through navigation
    test, not just `href` inspection.
  - Schools band CTA → `/pay/organisation`, confirmed separately.
  - Spotlight hover: confirmed `--x`/`--y` custom properties actually
    update on `mousemove` (not just that the CSS class is present), and
    screenshotted a hovered "How it works" card showing the glow + lift.
  - Stats strip and subject pills render the real, verified data above,
    not placeholders.
  - Mobile: floating symbols correctly reduced to 5 of 8 visible (the
    `nth-child(n+6)` rule), runner hidden, CTAs stacked full-width,
    hamburger menu opens/closes and its links work.
- `npm run lint`, `npm run type-check`, `npm run build` — all clean; `/`
  builds as a static page.
- Grepped the final copy for em dashes and WAEC/NECO/JAMB/"one time"
  mentions before considering this done, not just visual proofreading.
  Found and fixed one em dash in the page's `<title>` metadata (real
  user-facing text — appears in the browser tab and search results); all
  other em-dash hits were in code comments, which aren't user-facing copy
  and were left as-is.

## Gaps / follow-ups

- The runner character and floating-symbol energy level haven't been
  reviewed by the team at full scale yet, per the brief's own framing —
  both are isolated to single components/arrays specifically so that
  review is easy to act on.
- The new `LandingBrandMark` is explicitly placeholder art; it will need
  to be swapped once the team's real logo design lands, and at that point
  it's worth reconsidering whether to also update the shared `LogoMark`
  used elsewhere for a consistent brand identity across the whole app.
