'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import LandingBrandMark from '@/components/landing/LandingBrandMark';

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
      style={{ background: 'linear-gradient(160deg, #0F1F17 0%, #16321F 55%, #0F1F17 100%)' }}
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Top row — mirrors the sticky nav bar */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <LandingBrandMark size={30} />
          <span className="font-bold text-[17px] text-white">Recall</span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Link list — vertically centered in remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <a
          href="#how-it-works"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-white transition-colors hover:text-[#4ADE80]"
        >
          How it works
        </a>
        <Link
          href="/admin/login"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-white transition-colors hover:text-[#4ADE80]"
        >
          For Schools
        </Link>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="text-lg font-semibold text-white transition-colors hover:text-[#4ADE80]"
        >
          Sign in
        </Link>
        <div className="w-full border-t border-white/10" />
        <div className="w-full max-w-xs">
          <Link
            href="/pay/individual"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4ADE80] px-6 py-3 text-[15px] font-bold text-[#0F1F17] transition-colors hover:bg-[#3fcf72]"
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
        className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Menu size={20} strokeWidth={2} aria-hidden />
      </button>

      {/* Overlay teleported to document.body — escapes the sticky header's compositing layer */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
