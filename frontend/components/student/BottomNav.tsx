'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, BookOpen, RefreshCw, Activity, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  label: string;
  icon: LucideIcon;
  href: string;
}

const TABS: Tab[] = [
  { label: 'Home',     icon: House,      href: '/student' },
  { label: 'Browse',   icon: BookOpen,   href: '/student/learn' },
  { label: 'Review',   icon: RefreshCw,  href: '/student/review' },
  { label: 'Progress', icon: Activity,   href: '/student/progress' },
  { label: 'Settings', icon: Settings,   href: '/student/settings' },
];

interface BottomNavProps {
  recallCount?: number;
}

export function BottomNav({ recallCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  // Portal-mount guard: document.body doesn't exist during SSR, and
  // createPortal needs a real DOM node, so render nothing until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nav = (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-card shadow-[0_-1px_0_rgba(0,0,0,0.06)]">
      <div
        className="flex w-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {TABS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname
            ? href === '/student'
              ? pathname === '/student'
              : pathname.startsWith(href)
            : false;
          const showBadge = label === 'Review' && recallCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors duration-150 ${
                isActive ? 'text-brand' : 'text-faint'
              }`}
            >
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={isActive ? 'text-brand' : 'text-faint'}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-card">
                    {recallCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  if (!mounted) return null;

  // Rendered via a portal straight to <body>, regardless of where in the
  // component tree this is called from. Several student pages wrap their
  // content in a `page-enter`-animated div whose keyframes always specify a
  // `transform` (even the resting translateY(0) state) — any ancestor with
  // a `transform` becomes the containing block for a `position: fixed`
  // descendant, so a nav nested inside that wrapper ends up anchored to it
  // instead of the real viewport and scrolls out of place. Portaling to
  // `document.body` sidesteps the containing-block problem entirely, for
  // every caller, without needing each page to restructure its own JSX.
  return createPortal(nav, document.body);
}
