'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, RefreshCw, Clock, BookMarked, Sparkles, CheckCircle2 } from 'lucide-react';
import { getRecallQueue, getCachedRecallQueue } from '@/lib/api/topics';
import type { RecallItem } from '@/types/topics';

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
  const [queue, setQueue] = useState<RecallItem[] | null>(() => getCachedRecallQueue());
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

  if (fetchError && !queue) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center text-sm text-muted">{fetchError}</p>
      </div>
    );
  }

  if (!queue) return <RecallSkeleton />;

  const minuteEstimate = Math.ceil(queue.length * 2.5);

  function handleStartAll() {
    sessionStorage.setItem('recall_queue', JSON.stringify(queue));
    router.push('/student/review/session');
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <div className="page-with-nav bg-bg-0 page-enter">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
          <button
            onClick={() => router.push('/student')}
            className="flex items-center text-ink active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-ink">Daily Review</h1>
            <p className="text-[13px] text-muted">{dateLabel}</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-8 pb-nav text-center max-w-md mx-auto">
          {/* Badge & Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dim border border-brand/20 shadow-xs">
            <Sparkles size={30} strokeWidth={1.8} className="text-brand" />
          </div>

          <h2 className="text-[20px] font-bold text-ink tracking-tight mb-2">
            No Reviews Scheduled Yet
          </h2>
          <p className="text-[14px] leading-relaxed text-muted mb-6">
            Recall uses spaced repetition to bring back topics right before you forget them. Complete a lesson in Learn mode, and your review cards will appear here automatically.
          </p>

          {/* Spaced repetition micro-guide */}
          <div className="w-full text-left rounded-2xl border border-border bg-card p-4 mb-6 shadow-xs space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
              How Spaced Repetition Works
            </p>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white mt-0.5">
                1
              </span>
              <p className="text-[13px] text-ink leading-snug">
                <strong>Learn a topic:</strong> Master key concepts with step-by-step explanations and real-world examples.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white mt-0.5">
                2
              </span>
              <p className="text-[13px] text-ink leading-snug">
                <strong>Smart intervals:</strong> Quick 2-minute review cards are scheduled at Day 1, 3, and 7.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white mt-0.5">
                3
              </span>
              <p className="text-[13px] text-ink leading-snug">
                <strong>Lock in memory:</strong> Retain everything effortlessly for your WAEC, JAMB, or school exams.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/student/learn')}
            className="btn-primary w-full shadow-brand"
          >
            Start Learning Topics →
          </button>
        </main>
      </div>
    );
  }

  // ── Queue present ──────────────────────────────────────────────────────
  return (
    <div className="page-with-nav bg-bg-0 page-enter">

      {/* Appbar */}
      <header className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button
          onClick={() => router.push('/student')}
          className="flex items-center text-ink active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-ink">Daily Review</h1>
          <p className="text-[13px] text-muted">{dateLabel}</p>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-nav">

        {/* Info card */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3.5 shadow-sm">
          <BookMarked size={22} strokeWidth={2} className="flex-shrink-0 text-brand" />
          <div className="flex-1">
            <p className="text-[15px] font-bold text-ink">
              {queue.length} {queue.length === 1 ? 'topic' : 'topics'} due today
            </p>
            <p className="flex items-center gap-1 text-[13px] text-muted">
              <Clock size={10} strokeWidth={2} />
              ~{minuteEstimate} minutes
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="text-[16px] font-black text-ink">
              0/{queue.length}
            </p>
            <p className="text-[9px] font-semibold text-muted">done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-bg-2">
          <div className="h-full w-0 rounded-full bg-brand" />
        </div>

        {/* Topic list */}
        <div className="mb-6 flex flex-col gap-2">
          {queue.map((item) => (
            <div
              key={item.topic_id}
              className="card flex items-center gap-3 px-3.5 py-3"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-1 border border-border">
                <BookOpen size={14} strokeWidth={2} className="text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">
                  {item.topic_title}
                </p>
                <p className="text-[13px] font-medium text-muted">
                  {item.subject} · Due today
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStartAll}
          className="btn-primary w-full shadow-brand-sm"
        >
          Start All Reviews →
        </button>

      </main>
    </div>
  );
}
