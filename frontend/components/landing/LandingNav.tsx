'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MobileNav from '@/components/landing/MobileNav';
import { dmSans, bricolage } from '@/components/landing/landingFonts';
import { NAV_LINKS } from '@/components/landing/navLinks';

/**
 * Landing nav — transparent over the dark navy hero, solidifies (navy +
 * border + blur) once the page scrolls. Positioned `fixed` rather than
 * `position: sticky`: `sticky` only stays stuck while its own containing
 * block (this section's box) is still on screen, so it would scroll away
 * the moment the hero's box ends. `fixed` overlaps the hero from the first
 * frame (which is what reads as "transparent over the hero") and keeps
 * doing so for the rest of the page. `LandingHero` adds top padding to
 * clear this bar's height so the headline isn't hidden behind it.
 *
 * Layout: `grid-cols-[1fr_auto_1fr]` rather than three equal flex thirds —
 * that centers the link cluster exactly between the wordmark and the
 * auth buttons even though those two sides aren't the same width.
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`${dmSans.variable} ${bricolage.variable} fixed inset-x-0 top-0 z-40 transition-colors duration-200 ${
        scrolled ? 'border-b border-white/10 bg-[#0A0F1E]/90 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4 py-3.5 sm:px-7">
        {/* Left — wordmark. Explicit col-start-1: with `hidden` removing
            elements from grid flow entirely on mobile (not just hiding
            them), auto-placement would otherwise shift later items left
            to fill the gap — pin every column explicitly instead. */}
        {/* font-semibold (600), not font-bold (700) — Bricolage Grotesque is
            only loaded at 600/800 (see landingFonts.ts); 800 is reserved for
            the hero headline, so the wordmark uses the other loaded weight
            rather than requesting an unloaded 700 and triggering a fallback/
            synthetic-bold render. */}
        <Link
          href="/"
          className="font-heading col-start-1 justify-self-start text-[19px] font-semibold tracking-[-0.03em] text-white"
        >
          Recall
        </Link>

        {/* Center — nav links, desktop only */}
        <div className="font-body col-start-2 hidden items-center gap-6 justify-self-center sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-white/65 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right — auth actions, desktop only */}
        <div className="font-body col-start-3 hidden items-center gap-4 justify-self-end sm:flex">
          <Link href="/login" className="text-[14px] font-semibold text-white/80 transition-colors hover:text-white">
            Log in
          </Link>
          <Link
            href="/pay/individual"
            className="inline-flex items-center justify-center rounded-[10px] bg-jade px-[18px] py-[9px] text-[14px] font-semibold text-white transition-colors hover:bg-jade-dark"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile — hamburger, same column as the desktop right column */}
        <div className="col-start-3 justify-self-end sm:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
