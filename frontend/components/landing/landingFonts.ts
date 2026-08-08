import { DM_Sans, Bricolage_Grotesque } from 'next/font/google';

// Scoped to the landing page only — same pattern the old hero used for
// Space Mono. Defined once here (not per-component) so LandingNav and
// LandingHero share a single font instance instead of re-instantiating the
// loader, per next/font's own recommendation. Registered as `font-heading`
// / `font-body` in tailwind.config.ts.
//
// `font-heading` pointed at Syne, then at this same DM Sans variable, in
// earlier revisions — now points at Bricolage Grotesque. `font-body` stays
// DM Sans throughout.

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-bricolage',
});
