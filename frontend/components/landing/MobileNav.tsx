'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import RecallLogo from '@/components/ui/RecallLogo';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from './navLinks';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Native modality makes the background inert and traps keyboard focus.
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, mounted]);

  const close = () => setOpen(false);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-controls="landing-menu" aria-expanded={open} className="mobile-menu-trigger flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white">
        <Menu size={22} aria-hidden />
      </button>
      {mounted && createPortal(
        <dialog
          ref={dialogRef} id="landing-menu" aria-label="Menu"
          onCancel={close}
          onClose={() => { close(); triggerRef.current?.focus(); }}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]');
            const first = controls[0];
            const last = controls[controls.length - 1];
            // Keep Tab cycling in the drawer, including at browser-chrome boundaries.
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
          }}
          className="landing-menu fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-[min(24rem,calc(100%_-_1rem))] max-w-none overflow-y-auto border-0 border-l border-white/10 bg-[#0A0F1E] p-0 text-white shadow-2xl"
        >
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
              <Link href="/" onClick={close} aria-label="Recall home"><RecallLogo variant="light" className="h-8 w-auto" /></Link>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"><X size={22} aria-hidden /></button>
            </div>
            <div className="flex flex-col gap-2 px-5 py-6">
              {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={close} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-white/10">{link.label}</a>)}
            </div>
            <div className="mt-auto flex flex-col gap-3 border-t border-white/10 px-5 py-6">
              <Link href="/join" onClick={close} className="rounded-xl border border-white/25 px-4 py-3 text-center font-semibold">Enter school code</Link>
              <Link href="/pay/individual" onClick={close} className="rounded-xl bg-brand-dark px-4 py-3 text-center font-semibold hover:bg-green-900">Get individual access</Link>
              <Link href="/login" onClick={close} className="rounded-lg px-4 py-3 text-center font-medium text-white/85 hover:bg-white/10">Log in</Link>
            </div>
          </div>
        </dialog>, document.body
      )}
      <noscript><style>{'.mobile-menu-trigger { display: none; }'}</style></noscript>
    </>
  );
}
