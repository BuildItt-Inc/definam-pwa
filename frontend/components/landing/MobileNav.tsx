'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import LogoMark from '@/components/landing/LogoMark';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Delay portal mount until after hydration — document.body isn't available on the server.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const overlay = (
    <div
      className={`fixed inset-0 z-50 bg-card flex flex-col transition-opacity duration-200 ${ open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none' }`}
    >
      {/* Top row — mirrors the sticky nav bar */}
      <div className="h-14 border-b border-cream flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2"
        >
          <LogoMark size={28} />
          <span className="font-bold font-bold text-[17px] text-ink">DefinAm</span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="flex items-center justify-center w-9 h-9 rounded-md text-ink-2 hover:text-ink hover:bg-bg-2 transition-colors"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Link list — vertically centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center items-center gap-8 p-6">
        <a
          href="#how-it-works"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-ink hover:text-ink transition-colors"
        >
          How it works
        </a>
        <Link
          href="/pay/organisation"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-ink hover:text-ink transition-colors"
        >
          For schools
        </Link>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-ink hover:text-ink transition-colors"
        >
          Login
        </Link>
        <div className="w-full border-t border-cream" />
        <div className="w-full max-w-xs">
          <Link
            href="/pay/individual"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-ink text-white text-[15px] font-semibold px-6 py-3 rounded-xl hover:bg-ink-dark transition-colors"
          >
            Get started
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
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
        className="flex items-center justify-center w-9 h-9 rounded-md text-ink-2 hover:text-ink hover:bg-bg-2 transition-colors"
      >
        <Menu size={20} strokeWidth={2} aria-hidden />
      </button>

      {/* Overlay teleported to document.body — escapes the sticky header's compositing layer */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
