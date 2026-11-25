'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, BookMarked, TrendingUp, ArrowRight } from 'lucide-react';
import { getRecallQueue, getCachedRecallQueue } from '@/lib/api/topics';
import type { RecallItem } from '@/types/topics';
import { getStudentProfile, filterTopicsByProfile } from '@/lib/utils/studentProfile';

// ── Loading skeleton ───────────────────────────────────────────────────────

function RecallSkeleton() {
  return (
    <div className="page-with-nav bg-bg-0">
      <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="mb-1.5 h-7 w-36 animate-pulse rounded bg-bg-3" />
        <div className="mb-6 h-4 w-44 animate-pulse rounded bg-bg-2" />
        <div className="mb-4 h-44 animate-pulse rounded-2xl bg-bg-2" />
        <div className="h-36 animate-pulse rounded-2xl bg-bg-2" />
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
  const [profile, setProfile] = useState(() => getStudentProfile());
  const router = useRouter();
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => setProfile(getStudentProfile());
    window.addEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    setDateLabel(todayLabel());
    setFetchError(null);
    getRecallQueue()
      .then((items) => {
        setQueue(items);
        if (typeof window !== 'undefined') {
          const filteredCount = filterTopicsByProfile(items, getStudentProfile()).length;
          window.dispatchEvent(new CustomEvent('recallQueueUpdated', { detail: filteredCount }));
        }
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [retryTick]);

  if (fetchError && !queue) {
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

  if (!queue) return <RecallSkeleton />;

  const effectiveQueue = filterTopicsByProfile(queue, profile);
  const minuteEstimate = Math.ceil(effectiveQueue.length * 2.5);

  function handleStartAll() {
    sessionStorage.setItem('recall_queue', JSON.stringify(effectiveQueue));
    router.push('/student/review/session');
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (effectiveQueue.length === 0) {
    return (
      <div className="page-with-nav bg-bg-0 page-enter">
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-nav">
          {/* Clean tab header — no back button */}
          <header className="mb-8">
            <h1 className="text-[24px] font-bold tracking-tight text-ink">Daily Review</h1>
            {dateLabel && (
              <p className="mt-0.5 text-[13.5px] text-muted">{dateLabel}</p>
            )}
          </header>

          {/* Calm caught-up state */}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-brand">
                <TrendingUp size={22} strokeWidth={2} />
              </div>

              <h2 className="text-[20px] font-bold tracking-tight text-ink">
                You&apos;re all caught up
              </h2>
              <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-muted">
                Recall brings topics back right as your memory starts to fade.
              </p>

              <button
                type="button"
                onClick={() => router.push('/student/learn')}
                className="btn-primary mt-5 w-full"
              >
                <span>Study a new topic</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Single calm editorial explainer card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="px-4 pt-4 pb-3.5">
                <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  How it works
                </p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-[13px] font-bold text-brand tabular-nums">
                      1
                    </span>
                    <p className="text-[13px] font-semibold text-ink">Learn</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                      Study a topic step by step
                    </p>
                  </div>

                  <div>
                    <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-[13px] font-bold text-brand tabular-nums">
                      3
                    </span>
                    <p className="text-[13px] font-semibold text-ink">Review</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                      2-min cards on Day 1, 3 &amp; 7
                    </p>
                  </div>

                  <div>
                    <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-[13px] font-bold text-brand tabular-nums">
                      7
                    </span>
                    <p className="text-[13px] font-semibold text-ink">Remember</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                      Ready for WAEC &amp; exams
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border bg-bg-0/70 px-4 py-2.5 text-[12px] text-muted">
                <Clock size={14} strokeWidth={2} className="flex-shrink-0 text-brand" />
                <span>
                  Finished a topic today? Your first review unlocks after <strong className="font-semibold text-ink">24 hours</strong>.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Queue present ──────────────────────────────────────────────────────
  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-nav">
        <header className="mb-4">
          <h1 className="text-[24px] font-bold tracking-tight text-ink">Daily Review</h1>
          {dateLabel && (
            <p className="mt-0.5 text-[13.5px] text-muted">{dateLabel}</p>
          )}
        </header>

        {/* Summary card */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
            <BookMarked size={19} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">
              {effectiveQueue.length} {effectiveQueue.length === 1 ? 'topic' : 'topics'} due today
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
              <Clock size={12} strokeWidth={2} />
              <span>About {minuteEstimate} minutes</span>
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[15px] font-bold text-ink tabular-nums">
              0/{effectiveQueue.length}
            </p>
            <p className="text-[11px] text-muted">done</p>
          </div>
        </div>

        {/* Topic list */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          {effectiveQueue.map((item) => (
            <div
              key={item.topic_id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <BookOpen size={17} strokeWidth={1.8} className="flex-shrink-0 text-ink-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-ink">
                  {item.topic_title}
                </p>
                <p className="text-[12.5px] text-muted">
                  {item.subject} · Due today
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Ink CTA */}
        <button
          type="button"
          onClick={handleStartAll}
          className="btn-primary w-full"
        >
          <span>Start all reviews</span>
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </main>
    </div>
  );
}
