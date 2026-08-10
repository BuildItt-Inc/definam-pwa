# Week 20 — Hero Mockup: CSS Phone → Real Product Screenshot

## What was audited/built

Replaced the CSS-drawn phone mockup in the landing hero
([LandingHero.tsx](../components/landing/LandingHero.tsx)) with the real
laptop+phone product screenshot supplied at `public/hero-mockup.png`,
rendered via `next/image`.

## Files changed

- `components/landing/LandingHero.tsx` — swapped `<HeroPhoneMockup />` for
  a `next/image` `<Image>`, kept it in the same right-column slot with the
  same staggered fade-up-on-scroll animation (`fadeUp`, `custom={4}`).
- `public/hero-mockup-cropped.png` — **new**, derived from the supplied
  `hero-mockup.png`. See "What was found / fixed" below for why.
- `public/hero-mockup.png` — left untouched (original asset as supplied,
  unreferenced from code now).

## What was found / fixed

**Transparency check (per the brief's explicit ask):** confirmed via pixel
inspection (`sharp`, PNG color type 6 = RGBA) that `hero-mockup.png` is a
genuinely transparent PNG — alpha is 0 in the margins/corners and only the
laptop/phone screen content itself is opaque white, which is correct (it's
part of the mockup's UI, not a background). So it sits cleanly on the dark
hero with no white box. Confirmed this pixel-by-pixel rather than trusting
the flattened preview render, which composites transparency onto white and
would have looked like a solid background otherwise.

**Sizing problem found and fixed:** the source canvas is 1080×1920 
(portrait), but the actual laptop+phone content only occupies a
~968×894 region in the middle (roughly y 646–1541), i.e. over 700px of
vertical transparent padding above and below the devices. Using the
source file directly with `next/image` would have made the mockup render
tiny and off-center inside its hero column — exactly what the brief asked
to avoid. Fixed by trimming the transparent canvas padding down to the
content bounding box (+30px buffer per side) into
`public/hero-mockup-cropped.png` (1000×954, still fully transparent
outside the devices) and referencing that file from the component with
matching `width={1000} height={954}`. No visible pixels were altered —
only empty transparent canvas was trimmed.

Original `hero-mockup.png` was left in place rather than overwritten,
since it wasn't an asset this task created — happy to delete it if it's
just dead weight, but left that call to you.

## Implementation notes

- `next/image` with `priority` set (it's above-the-fold) and
  `alt="Recall app on laptop and phone"`.
- Sized with `w-full max-w-[420px] sm:max-w-[480px] lg:max-w-none` inside
  the existing right-column flex container, so it fills the column on
  desktop and centers below the copy on mobile, matching the old phone
  mockup's slot exactly.
- `HeroPhoneMockup` (`components/landing/HeroPhoneMockup.tsx`) is now
  unused anywhere in the codebase (verified via repo-wide grep — its only
  other reference was its own definition file). **Not deleted** — flagged
  per the brief's explicit request, pending confirmation.

## Verification

- `npm run type-check` — clean, no errors.
- `npm run lint` (`next lint`) — clean, no warnings or errors.

## Gaps / follow-ups

- Confirm whether to delete `components/landing/HeroPhoneMockup.tsx` (now
  dead) and/or the original uncropped `public/hero-mockup.png` (now
  unreferenced).
