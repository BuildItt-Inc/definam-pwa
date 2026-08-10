// Single source of truth for the landing nav's link set, shared by
// LandingNav (desktop) and MobileNav (hamburger overlay) so the two can't
// drift out of sync — the brief calls for them to match exactly.
export const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faqs', label: 'FAQs' },
] as const;
