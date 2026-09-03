'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { dmSans, bricolage } from '@/components/landing/landingFonts';
import { NAV_LINKS } from '@/components/landing/navLinks';
import LandingBrandMark from './LandingBrandMark';

/**
 * Mobile nav — a right-edge drawer over a dimmed backdrop, matching the
 * redesigned nav's dark/jade aesthetic (this previously rendered a
 * full-screen, vertically-centered overlay left over from the pre-redesign
 * nav). Two independently-animated layers: the backdrop fades in/out while
 * the panel itself slides in from the right via `translate-x`, both driven
 * off the same `open` boolean so they stay in sync.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Delay portal mount until after hydration — document.body isn't available on the server.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock — keyed on `open` so it re-runs (and its cleanup
  // fires) on every toggle, not just once on mount, and the cleanup also
  // guarantees the lock can't survive an unmount while the menu happens to
  // be open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  const overlay = (
    <div
      className={`${dmSans.variable} ${bricolage.variable} fixed inset-0 z-50 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop — dims and slightly blurs the page behind the panel; tap to close */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel — right-edge drawer, roughly 3/4 of the screen width capped at max-w-sm
          so it never reads as a full-screen takeover */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute right-0 top-0 flex h-full w-3/4 max-w-sm flex-col border-l border-white/10 bg-[#0A0F1E] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top row — mirrors the sticky nav bar's wordmark + a close X */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex items-center gap-2">
            <LandingBrandMark size={32} />
            <span className="font-heading font-semibold text-white">Recall</span>
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Link list — left-aligned, stacked near the top of the panel */}
        <div className="font-body flex flex-col items-start gap-6 px-5 pt-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-[16px] font-semibold text-white transition-colors hover:text-jade-light"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth actions — compact buttons grouped together, not a full-width block */}
        <div className="font-body mt-auto flex items-center gap-3 border-t border-white/10 px-5 py-5">
          <Link
            href="/login"
            onClick={close}
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-4 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:border-white/40 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/pay/individual"
            onClick={close}
            className="inline-flex items-center justify-center rounded-lg bg-jade px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-jade-dark"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger — always visible, stays inside the nav */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Menu size={20} strokeWidth={2} aria-hidden />
      </button>

      {/* Overlay teleported to document.body — escapes the sticky header's compositing layer */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
