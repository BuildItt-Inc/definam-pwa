'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { House, BookOpen, RefreshCw, Activity, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getRecallQueue } from '@/lib/api/topics';
import { filterTopicsByProfile, getStudentProfile } from '@/lib/utils/studentProfile';
import type { RecallItem } from '@/types/topics';

interface Tab {
  label: string;
  icon: LucideIcon;
  href: string;
}

const TABS: Tab[] = [
  { label: 'Home',     icon: House,      href: '/student' },
  { label: 'Subjects', icon: BookOpen,   href: '/student/learn' },
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
  // Start from 0 (or explicit prop) so stale localStorage from an older session never shows phantom counts.
  const [recallCount, setRecallCount] = useState<number>(initialRecallCount ?? 0);
  const latestQueueRef = useRef<RecallItem[] | null>(null);

  const syncFilteredCount = useCallback((items: RecallItem[]) => {
    const profile = getStudentProfile();
    setRecallCount(filterTopicsByProfile(items, profile).length);
  }, []);

  // Sync recall queue count once on mount + listen for live queue/profile update events
  useEffect(() => {
    let isSubscribed = true;
    getRecallQueue()
      .then((items) => {
        if (isSubscribed && Array.isArray(items)) {
          latestQueueRef.current = items;
          syncFilteredCount(items);
        }
      })
      .catch(() => {
        // Silently catch in layout nav
      });

    const handleQueueUpdate = (e: CustomEvent<number>) => {
      if (typeof e.detail === 'number') {
        setRecallCount(e.detail);
      }
    };
    const handleProfileUpdate = () => {
      if (latestQueueRef.current) {
        syncFilteredCount(latestQueueRef.current);
      }
    };

    window.addEventListener('recallQueueUpdated', handleQueueUpdate as EventListener);
    window.addEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);

    return () => {
      isSubscribed = false;
      window.removeEventListener('recallQueueUpdated', handleQueueUpdate as EventListener);
      window.removeEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [syncFilteredCount]);

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
      className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-card shadow-[0_-1px_0_rgba(20,32,27,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Student Navigation"
    >
      <div className="mx-auto flex w-full max-w-2xl">
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
              className={`flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-semibold transition-colors duration-150 ${
                isActive ? 'text-brand' : 'text-muted hover:text-ink active:text-brand'
              }`}
            >
              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className={isActive ? 'text-brand' : 'text-muted'}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-card">
                    {recallCount > 9 ? '9+' : recallCount}
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
