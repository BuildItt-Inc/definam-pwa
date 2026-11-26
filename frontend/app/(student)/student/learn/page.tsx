'use client';

import { useEffect, useState } from 'react';
import { Search, BookOpen, Plus } from 'lucide-react';
import { getSubjects, getCachedSubjects } from '@/lib/api/topics';
import type { Subject } from '@/types/topics';
import { SubjectCard } from '@/components/student/SubjectCard';
import Link from 'next/link';
import {
  getStudentProfile,
  filterSubjectsByProfile,
  type StudentProfile,
} from '@/lib/utils/studentProfile';

// ── Loading skeleton ───────────────────────────────────────────────────────

function BrowseSkeleton() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div className="mx-auto max-w-2xl md:max-w-5xl px-4 md:px-7 pb-24 pt-[calc(env(safe-area-inset-top)+16px)] md:pt-7">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-28 animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-48 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-lg bg-bg-2" />
        </div>
        <div className="mb-4 h-10 md:w-72 animate-pulse rounded-xl bg-bg-2" />
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border md:border-0 md:bg-transparent md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5 md:rounded-xl md:border md:border-border md:bg-card">
              <div className="h-7 w-7 mx-1 flex-shrink-0 animate-pulse rounded-md bg-bg-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-bg-3" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2" />
                <div className="h-1 w-full animate-pulse rounded-full bg-bg-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(() => getCachedSubjects());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'my' | 'all'>(() => {
    const p = getStudentProfile();
    return p?.selectedSubjects && p.selectedSubjects.length > 0 ? 'my' : 'all';
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const next = getStudentProfile();
      setProfile(next);
      if (next?.selectedSubjects && next.selectedSubjects.length > 0) {
        setFilterMode('my');
      }
    };
    window.addEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('focus', handleProfileUpdate);
    return () => {
      window.removeEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, []);

  const hasSelectedSubjects = !!(profile?.selectedSubjects && profile.selectedSubjects.length > 0);

  useEffect(() => {
    setFetchError(null);
    getSubjects()
      .then(setSubjects)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [retryTick]);

  /* Error state */
  if (fetchError && !subjects) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-0 px-6 text-center">
        <p className="text-sm text-muted">{fetchError}</p>
        <button
          type="button"
          onClick={() => setRetryTick((n) => n + 1)}
          className="btn-primary px-5 text-xs"
        >
          Try again
        </button>
      </div>
    );
  }

  /* Loading skeleton */
  if (!subjects) return <BrowseSkeleton />;

  const mySubjects = hasSelectedSubjects ? filterSubjectsByProfile(subjects, profile) : [];
  const baseSubjects = filterMode === 'my' ? mySubjects : subjects;

  /* Client-side filter */
  const needle = query.toLowerCase().trim();
  const filtered = needle
    ? baseSubjects.filter((s) => s.name.toLowerCase().includes(needle))
    : baseSubjects;

  const subtitleText =
    filterMode === 'my' && mySubjects.length > 0
      ? `Showing your ${mySubjects.length} active ${mySubjects.length === 1 ? 'subject' : 'subjects'}`
      : `Showing all ${subjects.length} curriculum subjects`;

  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <div className="mx-auto flex w-full max-w-2xl md:max-w-5xl flex-1 flex-col px-4 md:px-7 pt-[calc(env(safe-area-inset-top)+16px)] md:pt-7 pb-nav">
        {/* Header with top-right Add or remove button on both mobile & desktop */}
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] md:text-[28px] font-bold leading-tight tracking-tight text-ink">
              Subjects
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted">
              {subtitleText}
            </p>
          </div>

          <Link
            href="/student/subjects"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 md:px-4 text-[12.5px] md:text-[13px] font-semibold text-ink shadow-2xs hover:bg-bg-2 active:scale-[0.98] transition-all"
          >
            <Plus size={15} strokeWidth={2.2} className="text-brand flex-shrink-0" />
            <span className="md:hidden">Add or remove</span>
            <span className="hidden md:inline">Add or remove subjects</span>
          </Link>
        </header>

        {/* Controls row: segmented pill selector + search bar */}
        <div className="mb-4 md:mb-5 flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
          <div className="grid grid-cols-2 rounded-xl bg-bg-2 p-1 md:inline-grid md:min-w-[260px] flex-shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('my')}
              className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
                filterMode === 'my'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              My subjects · {mySubjects.length}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All · {subjects.length}
            </button>
          </div>

          {/* Search bar */}
          <label className="flex min-h-[42px] flex-1 md:max-w-sm items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-[#14201B]/10 transition-all">
            <Search size={16} strokeWidth={1.8} className="flex-shrink-0 text-muted" />
            <input
              type="search"
              placeholder="Search subjects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14.5px] text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
        </div>

        {/* Grouped list on mobile, 2/3-col card grid on desktop */}
        <main className="flex-1 pb-4">
          {filterMode === 'my' && mySubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <BookOpen size={30} strokeWidth={1.6} className="mb-3 text-faint" />
              <p className="text-[15px] font-semibold text-ink">No subjects selected on this device yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted leading-relaxed">
                Pick the subjects you are studying this term so your dashboard and review queue stay focused.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/student/subjects"
                  className="btn-primary min-h-[40px] px-4 py-2 text-xs"
                >
                  Choose my subjects
                </Link>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="btn-secondary min-h-[40px] px-4 py-2 text-xs"
                >
                  Browse all ({subjects.length})
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center">
              <BookOpen size={30} strokeWidth={1.6} className="mb-3 text-faint" />
              <p className="text-[15px] font-semibold text-ink">No subjects found</p>
              <p className="mt-1 text-xs text-muted">
                Try another search term or view all available subjects.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {filterMode === 'my' && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className="btn-secondary min-h-[40px] px-3.5 py-2 text-xs"
                  >
                    View all ({subjects.length})
                  </button>
                )}
                <Link
                  href="/student/subjects"
                  className="btn-primary min-h-[40px] px-3.5 py-2 text-xs"
                >
                  Add or remove subjects
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
              {filtered.map((subject) => (
                <SubjectCard
                  key={subject.name}
                  subject={subject}
                  href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
