'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen } from 'lucide-react';
import { getSubjects } from '@/lib/api/topics';
import type { Subject } from '@/types/topics';
import { SubjectCard } from '@/components/student/SubjectCard';
import { BottomNav } from '@/components/student/BottomNav';

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
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [query, setQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  /* Error state */
  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center text-sm text-muted">{fetchError}</p>
      </div>
    );
  }

  /* Loading skeleton */
  if (!subjects) return <BrowseSkeleton />;

  /* Client-side filter */
  const needle = query.toLowerCase().trim();
  const filtered = needle
    ? subjects.filter((s) => s.name.toLowerCase().includes(needle))
    : subjects;

  return (
    <div className="flex min-h-screen flex-col bg-card">

      {/* ── SCR-05a · Appbar ─────────────────────────────────────────────── */}
      <header className="flex items-center border-b border-border px-4 py-3.5">
        <h1 className="font-bold text-[17px] font-bold text-ink">Browse</h1>
      </header>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <label className="flex items-center gap-2 rounded-lg border border-border-2 bg-bg-0 px-3 py-2.5">
          <Search size={15} strokeWidth={1.5} className="flex-shrink-0 text-muted" />
          <input
            type="search"
            placeholder="Search topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      {/* ── Subject list ─────────────────────────────────────────────────── */}
      <main className="flex-1 pb-20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <BookOpen
              size={32}
              strokeWidth={1.5}
              className="mb-3 text-gray-300"
            />
            <p className="text-[13px] text-muted">
              No subjects found
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onClick={() =>
                  router.push(
                    `/student/learn/${subject.id}?view=chapters&name=${encodeURIComponent(subject.name)}`,
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
