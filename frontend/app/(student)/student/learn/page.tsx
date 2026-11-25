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
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-28 animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-48 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-bg-2" />
        </div>
        <div className="mb-3 h-10 animate-pulse rounded-lg bg-bg-2" />
        <div className="mb-4 h-11 animate-pulse rounded-xl border border-border bg-card" />
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
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
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getStudentProfile());
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

  const mySubjects = hasSelectedSubjects ? filterSubjectsByProfile(subjects, profile) : subjects;
  const baseSubjects = filterMode === 'my' && hasSelectedSubjects ? mySubjects : subjects;

  /* Client-side filter */
  const needle = query.toLowerCase().trim();
  const filtered = needle
    ? baseSubjects.filter((s) => s.name.toLowerCase().includes(needle))
    : baseSubjects;

  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-nav">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
            Subjects
          </h1>
          <p className="mt-0.5 text-[13.5px] text-muted">
            Pick what you are studying this term.
          </p>
        </header>

        {/* Segmented tabs */}
        {hasSelectedSubjects && (
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-bg-2 p-1">
            <button
              type="button"
              onClick={() => setFilterMode('my')}
              className={`min-h-[36px] rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all ${
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
              className={`min-h-[36px] rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All · {subjects.length}
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="mb-4">
          <label className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-[#14201B]/10 transition-all">
            <Search size={16} strokeWidth={1.8} className="flex-shrink-0 text-muted" />
            <input
              type="search"
              placeholder="Search subjects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
        </div>

        {/* Grouped Subject Card */}
        <main className="flex-1 pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center">
              <BookOpen size={30} strokeWidth={1.6} className="mb-3 text-faint" />
              <p className="text-[15px] font-semibold text-ink">No subjects found</p>
              <p className="mt-1 text-xs text-muted">
                Try another search term or view all available subjects.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {hasSelectedSubjects && filterMode === 'my' && (
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
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
                {filtered.map((subject) => (
                  <SubjectCard
                    key={subject.name}
                    subject={subject}
                    href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
                  />
                ))}
              </div>

              <Link
                href="/student/subjects"
                className="btn-secondary w-full rounded-xl"
              >
                <Plus size={16} strokeWidth={2.2} />
                <span>Add or remove subjects</span>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
