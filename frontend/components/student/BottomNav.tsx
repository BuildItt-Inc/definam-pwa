'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

function matchesTab(pathname: string, href: string): boolean {
  return href === '/student' ? pathname === '/student' : pathname.startsWith(href);
}

function BottomNavContent({ recallCount: initialRecallCount }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Start from 0 (or explicit prop) so stale localStorage from an older session never shows phantom counts.
  const [recallCount, setRecallCount] = useState<number>(initialRecallCount ?? 0);
  // Optimistic active tab so taps feel instant and users never re-tap while chunks load
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const latestQueueRef = useRef<RecallItem[] | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncFilteredCount = useCallback((items: RecallItem[]) => {
    const profile = getStudentProfile();
    setRecallCount(filterTopicsByProfile(items, profile).length);
  }, []);

  // Eagerly prefetch all 5 tab bundles on mount so tab switches resolve immediately
  useEffect(() => {
    TABS.forEach((tab) => {
      router.prefetch(tab.href);
    });
  }, [router]);

  // Clear optimistic pending indicator as soon as route commits
  useEffect(() => {
    if (!pathname || !pendingHref) return;
    if (matchesTab(pathname, pendingHref)) {
      setPendingHref(null);
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    }
  }, [pathname, pendingHref]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
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

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Allow modifier clicks (open in new tab) to behave normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Already on this exact root route — no-op
    if (pathname === href) {
      e.preventDefault();
      return;
    }

    // Prevent duplicate stacked navigations when tapping the same pending tab repeatedly
    if (pendingHref === href) {
      e.preventDefault();
      return;
    }

    setPendingHref(href);
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = setTimeout(() => {
      setPendingHref(null);
    }, 5000);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-card shadow-[0_-1px_0_rgba(20,32,27,0.04)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Student Navigation"
    >
      {/* Subtle instant navigation indicator while transition is in flight */}
      {pendingHref && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-brand-tint"
        >
          <div className="nav-progress-bar h-full w-1/3 rounded-full bg-brand" />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-2xl">
        {TABS.map(({ label, icon: Icon, href }) => {
          const routeActive = matchesTab(pathname, href);
          const isActive = pendingHref ? pendingHref === href : routeActive;
          const isPendingThis = pendingHref === href && !routeActive;
          const showBadge = label === 'Review' && recallCount > 0;

          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={(e) => handleTabClick(e, href)}
              aria-busy={isPendingThis || undefined}
              className={`flex min-h-[54px] flex-1 touch-manipulation select-none flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-semibold transition-all duration-100 active:scale-95 ${
                isActive ? 'text-brand' : 'text-muted hover:text-ink active:text-brand'
              }`}
            >
              <span className={`relative transition-opacity ${isPendingThis ? 'opacity-75' : 'opacity-100'}`}>
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
