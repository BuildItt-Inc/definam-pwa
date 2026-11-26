'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { House, BookOpen, RefreshCw, Activity, Settings } from 'lucide-react';
import { getStudentProfile, type StudentProfile } from '@/lib/utils/studentProfile';
import { getCachedHomeData, getHomeData } from '@/lib/api/topics';
import { getMe } from '@/lib/api/auth';
import RecallLogo from '@/components/ui/RecallLogo';

const NAV_ITEMS = [
  { label: 'Home',     icon: House,     href: '/student' },
  { label: 'Subjects', icon: BookOpen,  href: '/student/learn' },
  { label: 'Review',   icon: RefreshCw, href: '/student/review' },
  { label: 'Progress', icon: Activity,  href: '/student/progress' },
  { label: 'Settings', icon: Settings,  href: '/student/settings' },
];

function matchesNav(pathname: string, href: string): boolean {
  return href === '/student' ? pathname === '/student' : pathname.startsWith(href);
}

function DesktopSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [resolvedName, setResolvedName] = useState<string>(() => {
    const p = getStudentProfile();
    const cachedHome = getCachedHomeData();
    return p?.name || cachedHome?.student_name || '';
  });
  const [resolvedSub, setResolvedSub] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const syncFromProfileAndApi = async () => {
      const p = getStudentProfile();
      const cachedHome = getCachedHomeData();
      if (active) setProfile(p);

      let homeName = cachedHome?.student_name || '';
      let schoolName = cachedHome?.school_name || '';

      try {
        const [me, home] = await Promise.all([
          getMe().catch(() => null),
          cachedHome ? Promise.resolve(cachedHome) : getHomeData().catch(() => null),
        ]);
        if (!active) return;

        if (home) {
          homeName = home.student_name || homeName;
          schoolName = home.school_name || schoolName;
        }

        const apiName = me?.name && me.name !== 'Student' ? me.name : '';
        const finalName =
          apiName ||
          (homeName && homeName !== 'Student' ? homeName : '') ||
          p?.name ||
          me?.username ||
          '';
        setResolvedName(finalName);

        const roleLabel = me?.role === 'student_individual' ? 'Independent learner' : schoolName;
        const subParts = [p?.class_level, roleLabel].filter(Boolean);
        setResolvedSub(subParts.join(' · '));
      } finally {
        if (active) setHydrated(true);
      }
    };

    void syncFromProfileAndApi();

    const handler = () => {
      const p = getStudentProfile();
      setProfile(p);
      if (p?.name) setResolvedName(p.name);
      void syncFromProfileAndApi();
    };
    window.addEventListener('studentProfileUpdated', handler);
    return () => {
      active = false;
      window.removeEventListener('studentProfileUpdated', handler);
    };
  }, []);

  if (!pathname) return null;

  // Distraction-free lesson / review / full-chat focus modes hide navigation sidebar
  const isReviewSession = pathname === '/student/review/session';
  const isChatPage = pathname === '/student/chat';
  const isTopicRoute = pathname.startsWith('/student/learn/') && pathname !== '/student/learn';
  const isInsideActiveLesson = isTopicRoute && !searchParams?.get('view');

  if (isReviewSession || isChatPage || isInsideActiveLesson) {
    return null;
  }

  const displayName = profile?.name || resolvedName;
  const initial = displayName ? displayName[0].toUpperCase() : '';
  const fallbackSub = [profile?.class_level, profile?.targets?.slice(0, 2).join(' · ')].filter(Boolean).join(' · ');
  const sub = resolvedSub || fallbackSub;

  return (
    <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 h-screen sticky top-0 border-r border-border bg-card z-40">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center">
        <Link href="/student" aria-label="Recall Home" className="inline-flex items-center">
          <RecallLogo variant="dark" className="h-[22px] w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = matchesNav(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-100 active:scale-[0.98] ${
                active
                  ? 'bg-brand-tint text-brand'
                  : 'text-muted hover:bg-bg-2 hover:text-ink'
              }`}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.3 : 1.75}
                className="flex-shrink-0"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-4 py-4 border-t border-border">
        <Link
          href="/student/settings"
          className="flex items-center gap-2.5 rounded-xl p-1.5 -m-1.5 hover:bg-bg-0 transition-colors"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white text-[13px] font-bold select-none">
            {initial || <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />}
          </div>
          <div className="min-w-0 flex-1">
            {displayName ? (
              <>
                <p className="truncate text-[13px] font-bold text-ink leading-tight">{displayName}</p>
                {sub && (
                  <p className="truncate text-[11px] text-faint leading-tight mt-0.5">{sub}</p>
                )}
              </>
            ) : !hydrated ? (
              <div className="space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-bg-2" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-bg-2" />
              </div>
            ) : (
              <p className="text-[12px] text-muted">Account settings</p>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

export function DesktopSidebar() {
  return (
    <Suspense fallback={null}>
      <DesktopSidebarInner />
    </Suspense>
  );
}
