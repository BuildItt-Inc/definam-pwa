import Link from 'next/link';
import Image from 'next/image';

import { NAV_LINKS } from '@/components/landing/navLinks';

// Account/Legal aren't shared with the nav (nav has no reason to link
// login/signup/legal), so they're defined here rather than pulled from
// navLinks.ts. Product reuses NAV_LINKS directly — same set, same
// destinations, no reason to duplicate it a third time.
const ACCOUNT_LINKS = [
  { href: '/login', label: 'Log in' },
  { href: '/pay/individual', label: 'Get individual access' },
  // Points at the schools contact/purchase flow, not `/admin/login` (which
  // is where the nav's own "For Schools" link goes) — same reasoning as
  // the schools CTA band: `/admin/login` has no signup path, and a visitor
  // reading the footer is more likely to be a prospect than an existing
  // admin. See docs/WEEK18_LANDING_PAGE_REDESIGN.md for the original call.
  { href: '/pay/organisation', label: 'For Schools' },
] as const;

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
] as const;

/**
 * Footer — flat `bg-ink`, not the hero's animated background pattern. This
 * is a utility section at the very bottom of the page, not a moment that
 * needs motion/depth; the brief's own framing ("clean, minimal") pointed
 * the same way, so flat felt like the right call over reusing
 * HeroBackground here too.
 */
export default function LandingFooter() {
  return (
    <footer className={`bg-ink px-6 pb-8 pt-14 sm:pt-16`}>
      <div className="mx-auto max-w-[1000px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.3fr_1fr_1fr_1fr] sm:gap-6">
          <div>
            <Image
              src="/recall-logo.svg"
              alt="Recall"
              width={512}
              height={166}
              className="h-8 w-auto"
            />
            <p className="font-body mt-3 max-w-[260px] text-[0.8125rem] leading-[1.6] text-white/60">
              A modern study platform for Nigerian secondary school students.
            </p>
          </div>

          <FooterColumn title="Product" links={NAV_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center sm:mt-16">
          <p className="font-body text-[0.75rem] text-white/70">&copy; 2026 Recall. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-body mb-3 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/75">
        {title}
      </p>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hash anchors use a plain `<a>` (matches LandingNav's own convention);
// real routes use `Link` for client-side navigation/prefetching.
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'font-body text-[0.8438rem] text-white/70 transition-colors hover:text-jade-light';
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
