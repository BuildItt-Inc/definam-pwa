import { DM_Sans } from 'next/font/google';

// Scoped to the landing page only — same pattern the old hero used for
// Space Mono. Defined once here (not per-component) so LandingNav and
// LandingHero share a single font instance instead of re-instantiating the
// loader, per next/font's own recommendation. Registered as `font-heading`
// / `font-body` in tailwind.config.ts (both point at this same font — see
// that file's comment).
//
// Syne was loaded here too as of the previous revision, used only via
// `font-heading`. Removed along with every `font-heading`/`syne.variable`
// reference on the landing page — DM Sans covers headings and body now, so
// keeping Syne loaded would just be dead weight.

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});
