'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-card">
      {/* Appbar */}
      <div className="flex items-center border-b border-border px-4 py-3.5">
        <div className="h-5 w-16 animate-pulse rounded bg-bg-3" />
      </div>
      {/* Search bar */}
      <div className="mx-3 my-2 h-10 animate-pulse rounded-lg bg-bg-2" />
      {/* Subject rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3"
        >
          <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-lg bg-bg-3" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 animate-pulse rounded bg-bg-3" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-5 w-8 animate-pulse rounded-[3px] bg-bg-2" />
        </div>
      ))}
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
  const router = useRouter();

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
    getSubjects()
      .then(setSubjects)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  /* Error state */
  if (fetchError && !subjects) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center text-sm text-muted">{fetchError}</p>
      </div>
    );
  }

  /* Loading skeleton */
  if (!subjects) return <BrowseSkeleton />;

  // Default to student's selected subjects
  const baseSubjects = (filterMode === 'my' && hasSelectedSubjects)
    ? filterSubjectsByProfile(subjects, profile)
    : subjects;

  /* Client-side filter */
  const needle = query.toLowerCase().trim();
  const filtered = needle
    ? baseSubjects.filter((s) => s.name.toLowerCase().includes(needle))
    : baseSubjects;

  return (
    <div className="page-with-nav bg-card page-enter">

      {/* ── SCR-05a · Appbar ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-2.5 border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-ink">Browse Subjects</h1>
            <p className="text-xs text-muted">
              {hasSelectedSubjects && filterMode === 'my'
                ? `Showing your ${profile?.selectedSubjects?.length || baseSubjects.length} active subjects`
                : `All ${subjects.length} curriculum subjects`}
            </p>
          </div>

          <Link
            href="/student/subjects"
            className="flex items-center gap-1 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-ink shadow-2xs hover:bg-bg-1 active:scale-95 transition-all sm:hidden"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add / Remove</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {hasSelectedSubjects && (
            <div className="flex items-center gap-1 rounded-xl bg-bg-2 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('my')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  filterMode === 'my'
                    ? 'bg-white text-ink shadow-2xs font-bold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                My Subjects ({profile?.selectedSubjects?.length || baseSubjects.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-ink shadow-2xs font-bold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All ({subjects.length})
              </button>
            </div>
          )}

          <Link
            href="/student/subjects"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-ink shadow-2xs hover:bg-bg-1 active:scale-95 transition-all"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add / Remove</span>
          </Link>
        </div>
      </header>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border-2 bg-bg-0">
        <label className="flex items-center gap-2 rounded-lg border border-border-2 bg-bg-1 px-3 py-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all">
          <Search size={15} strokeWidth={1.5} className="flex-shrink-0 text-muted" />
          <input
            type="search"
            placeholder="Search topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      {/* ── Subject list ─────────────────────────────────────────────────── */}
      <main className="flex-1 pb-nav">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <BookOpen
              size={32}
              strokeWidth={1.5}
              className="mb-3 text-faint"
            />
            <p className="text-base text-muted">
              No subjects found
            </p>
            <div className="mt-3 flex items-center gap-3">
              {hasSelectedSubjects && filterMode === 'my' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-xs font-bold text-brand underline underline-offset-4"
                >
                  View all subjects ({subjects.length})
                </button>
              )}
              <Link
                href="/student/subjects"
                className="text-xs font-bold text-ink underline underline-offset-4"
              >
                Manage your subjects
              </Link>
            </div>
          </div>
        ) : (
          <div>
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
  );
}
