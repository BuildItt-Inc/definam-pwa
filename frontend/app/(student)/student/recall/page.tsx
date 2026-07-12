'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, RefreshCw, Clock, BookMarked } from 'lucide-react';
import { getRecallQueue } from '@/lib/api/topics';
import type { RecallItem } from '@/types/topics';
import { BottomNav } from '@/components/student/BottomNav';

// ── Loading skeleton ───────────────────────────────────────────────────────

function RecallSkeleton() {
  return (
    <div className="min-h-screen bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <div className="h-5 w-5 animate-pulse rounded bg-bg-3" />
        <div className="h-5 w-28 animate-pulse rounded bg-bg-3" />
      </div>
      <div className="px-4 py-4">
        <div className="mb-4 h-20 animate-pulse rounded-xl bg-bg-2" />
        <div className="mb-4 h-2 animate-pulse rounded-full bg-bg-2" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-2 flex items-center gap-3 rounded-xl border border-border px-3.5 py-3"
          >
            <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-lg bg-bg-3" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-bg-3" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Today's date label ─────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function RecallPage() {
  const [queue, setQueue] = useState<RecallItem[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState('');
  const router = useRouter();

  useEffect(() => {
    setDateLabel(todayLabel());
    getRecallQueue()
      .then(setQueue)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center font-dm-sans text-sm text-muted">{fetchError}</p>
      </div>
    );
  }

  if (!queue) return <RecallSkeleton />;

  const minuteEstimate = Math.ceil(queue.length * 2.5);

  function handleStartAll() {
    sessionStorage.setItem('recall_queue', JSON.stringify(queue));
    router.push('/student/recall/session');
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-card">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <button
            onClick={() => router.push('/student')}
            className="flex items-center text-ink active:opacity-70"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="font-syne text-[17px] font-bold text-ink">Daily Recall</h1>
            <p className="font-dm-sans text-[11px] text-muted">{dateLabel}</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <RefreshCw size={40} strokeWidth={1.5} className="mb-4 text-gray-300" />
          <h2 className="mb-2 font-syne text-[17px] font-bold text-ink">
            You&apos;re all caught up!
          </h2>
          <p className="mb-6 font-dm-sans text-[13px] leading-relaxed text-muted">
            Nothing to review today. Come back tomorrow to keep your streak going.
          </p>
          <button
            onClick={() => router.push('/student/learn')}
            className="rounded-lg border-[1.5px] border-jade px-6 py-3 font-dm-sans text-[13px] font-bold text-jade active:opacity-70"
          >
            Browse Topics
          </button>
        </main>

        <BottomNav recallCount={0} />
      </div>
    );
  }

  // ── Queue present ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-card">

      {/* Appbar */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <button
          onClick={() => router.push('/student')}
          className="flex items-center text-ink active:opacity-70"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="font-syne text-[17px] font-bold text-ink">Daily Recall</h1>
          <p className="font-dm-sans text-[11px] text-muted">{dateLabel}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">

        {/* Info card */}
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-jade/30 bg-jade/10 px-3.5 py-3.5">
          <BookMarked size={22} strokeWidth={1.5} className="flex-shrink-0 text-jade" />
          <div className="flex-1">
            <p className="font-syne text-[13px] font-bold text-ink">
              {queue.length} {queue.length === 1 ? 'topic' : 'topics'} due today
            </p>
            <p className="flex items-center gap-1 font-dm-sans text-[11px] text-jade">
              <Clock size={10} strokeWidth={2} />
              ~{minuteEstimate} minutes · Pre-computed at midnight
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="font-syne text-[16px] font-black text-ink">
              0/{queue.length}
            </p>
            <p className="font-dm-sans text-[9px] text-muted">done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-bg-2">
          <div className="h-full w-0 rounded-full bg-jade" />
        </div>

        {/* Topic list */}
        <div className="mb-5 flex flex-col gap-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border-[1.5px] border-border-2 px-3.5 py-3"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border-2">
                <BookOpen size={13} strokeWidth={1.5} className="text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-dm-sans text-[13px] font-bold text-ink">
                  {item.topic_title}
                </p>
                <p className="font-dm-sans text-[11px] text-muted">
                  {item.subject} · Due today
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStartAll}
          className="flex w-full items-center justify-center rounded-xl bg-jade py-3.5 font-syne text-[14px] font-bold text-white active:opacity-90"
        >
          Start All Reviews →
        </button>

      </main>

      <BottomNav recallCount={queue.length} />
    </div>
  );
}
