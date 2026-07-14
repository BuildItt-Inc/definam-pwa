'use client';

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
  { label: 'Recall',   icon: RefreshCw,  href: '/student/recall' },
  { label: 'Progress', icon: Activity,   href: '/student/progress' },
  { label: 'Settings', icon: Settings,   href: '/student/settings' },
];

interface BottomNavProps {
  recallCount?: number;
}

export function BottomNav({ recallCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card pb-safe pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
      {TABS.map(({ label, icon: Icon, href }) => {
        // Exact match for /student so /student/learn doesn't also highlight Home.
        const isActive = pathname
          ? href === '/student'
            ? pathname === '/student'
            : pathname.startsWith(href)
          : false;
        const showBadge = label === 'Recall' && recallCount > 0;

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 pb-3 pt-2 text-[10px] font-semibold transition-all duration-200 ${
              isActive ? 'text-brand scale-105' : 'text-faint hover:text-muted'
            }`}
          >
            <span className="relative">
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.5}
                className={`transition-colors ${isActive ? 'text-brand fill-brand/20' : 'text-faint'}`}
              />
              {showBadge && (
                <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse-brand">
                  {recallCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
