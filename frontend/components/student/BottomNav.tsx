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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white">
      {TABS.map(({ label, icon: Icon, href }) => {
        // Exact match for /student so /student/learn doesn't also highlight Home.
        const isActive =
          href === '/student' ? pathname === '/student' : pathname.startsWith(href);
        const showBadge = label === 'Recall' && recallCount > 0;

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 pb-4 pt-2 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-jade' : 'text-gray-400'
            }`}
          >
            <span className="relative">
              <Icon
                size={20}
                strokeWidth={1.5}
                className={isActive ? 'text-jade' : 'text-gray-400'}
              />
              {showBadge && (
                <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-jade px-0.5 text-[9px] font-bold text-white">
                  {recallCount}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
