# Week 21 — Mobile Nav: Right-Edge Drawer to Match Redesign

## What was audited/built

`MobileNav` was missed in the earlier landing redesign
([WEEK18_LANDING_PAGE_REDESIGN.md](WEEK18_LANDING_PAGE_REDESIGN.md)) and
still used the pre-redesign layout — a full-screen overlay with links
vertically centered and one large "Sign up" button. Rebuilt it as a
right-edge drawer to match the current nav/hero aesthetic.

## Files changed

- `components/landing/MobileNav.tsx` — rewritten.

## What changed, specifically

- **Full-screen centered overlay → right-edge drawer.** Panel is now
  `w-3/4 max-w-sm` (never full width), slides in from the right via
  `translate-x-full` → `translate-x-0`, `duration-300`. A separate
  backdrop layer (`bg-ink/60 backdrop-blur-sm`) fades in behind it and
  closes the menu on tap; the two layers animate independently off the
  same `open` state so they stay in sync.
- **Vertically-centered links → left-aligned, stacked near the top.**
  `items-start`/left-aligned text directly under the header row instead
  of `justify-center` in the middle of the panel.
- **One full-width "Sign up" button → two compact buttons.** "Log in"
  (outlined/ghost) and "Sign up" (filled jade) now sit side by side at
  the bottom of the panel, sized like normal buttons rather than a
  full-width block — pinned to the bottom via `mt-auto` with a divider
  above, so they stay put regardless of how many nav links there are.
- **Fonts/branding.** Wordmark now plain "Recall" text in `font-heading`
  (Bricolage Grotesque), matching `LandingNav`'s desktop wordmark exactly
  — dropped the `LandingBrandMark` icon lockup the old overlay used
  instead, per "remove any old logo/branding." Links use `font-body` (DM
  Sans), hover state now uses the `jade-light` token instead of the old
  hardcoded `#4ADE80` hex.
- **Scroll lock.** Behavior is unchanged (`document.body.style.overflow`
  toggled in a `useEffect` keyed on `open`, with cleanup) — reviewed for
  the bug history called out in the brief and it was already correct: the
  effect is keyed on `open` (not `[]`), so it re-runs on every toggle, and
  the cleanup fires on both toggle-to-closed and unmount, so the lock
  can't be left stuck.
- Nav links still come from the shared `NAV_LINKS` (`navLinks.ts`) and
  anchor-scroll to `#home` / `#how-it-works` / `#pricing` / `#faqs`, close
  the menu on click. "Log in" → `/login`, "Sign up" → `/pay/individual`
  (same route `LandingNav`'s desktop "Sign up" uses).

## Flagged, not deleted

`components/landing/LandingBrandMark.tsx` was only ever referenced from
the old `MobileNav` overlay (its docstring already notes it was a
landing-only placeholder, distinct from the shared `LogoMark`). It's now
unused everywhere — grep-confirmed. Left in place pending confirmation,
same as `HeroPhoneMockup.tsx` flagged as dead in
[WEEK20_HERO_MOCKUP_IMAGE.md](WEEK20_HERO_MOCKUP_IMAGE.md).

## Verification

- `npm run type-check` — clean, no errors.
- `npm run lint` (`next lint`) — clean, no warnings or errors.

## Gaps / follow-ups

- Confirm whether to delete `LandingBrandMark.tsx` (now dead), same open
  question as `HeroPhoneMockup.tsx` from the previous task.
