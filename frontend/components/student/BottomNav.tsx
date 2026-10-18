'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { House, BookOpen, RefreshCw, Activity, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getRecallQueue } from '@/lib/api/topics';

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

export interface BottomNavProps {
  recallCount?: number;
}

function BottomNavContent({ recallCount: initialRecallCount }: BottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [recallCount, setRecallCount] = useState<number>(initialRecallCount ?? 0);

  // Fetch or sync recall queue count across persistent session
  useEffect(() => {
    let isSubscribed = true;
    getRecallQueue()
      .then((items) => {
        if (isSubscribed && Array.isArray(items)) {
          setRecallCount(items.length);
        }
      })
      .catch(() => {
        // Silently catch in layout nav
      });

    const handleQueueUpdate = (e: CustomEvent<number>) => {
      setRecallCount(e.detail);
    };
    window.addEventListener('recallQueueUpdated', handleQueueUpdate as EventListener);

    return () => {
      isSubscribed = false;
      window.removeEventListener('recallQueueUpdated', handleQueueUpdate as EventListener);
    };
  }, [pathname]);

  if (!pathname) return null;

  // Decide if BottomNav should be visible
  const isReviewSession = pathname === '/student/review/session';
  const isChatPage = pathname === '/student/chat';

  // Topic detail vs chapters/topics browse
  const isTopicRoute = pathname.startsWith('/student/learn/') && pathname !== '/student/learn';
  const view = searchParams?.get('view');
  const isInsideActiveLesson = isTopicRoute && !view;

  if (isReviewSession || isChatPage || isInsideActiveLesson) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-card shadow-[0_-1px_0_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Student Navigation"
    >
      <div className="flex w-full">
        {TABS.map(({ label, icon: Icon, href }) => {
          const isActive =
            href === '/student'
              ? pathname === '/student'
              : pathname.startsWith(href);
          const showBadge = label === 'Review' && recallCount > 0;

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors duration-150 ${
                isActive ? 'text-brand' : 'text-faint hover:text-ink active:text-brand'
              }`}
            >
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={isActive ? 'text-brand' : 'text-faint'}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-card animate-in fade-in zoom-in duration-200">
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
}

export function BottomNav(props: BottomNavProps) {
  return (
    <Suspense fallback={null}>
      <BottomNavContent {...props} />
    </Suspense>
  );
}
