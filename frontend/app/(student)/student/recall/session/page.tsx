'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';
import type { RecallItem } from '@/types/topics';
import { QualityRating } from '@/components/student/QualityRating';
import { mockHomeData } from '@/lib/api/mock/data';

// ── Session page ──────────────────────────────────────────────────────────

export default function RecallSessionPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<RecallItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('recall_queue');
      if (!raw) {
        router.replace('/student/recall');
        return;
      }
      const parsed = JSON.parse(raw) as RecallItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        router.replace('/student/recall');
        return;
      }
      setQueue(parsed);
    } catch {
      router.replace('/student/recall');
    }
  }, [router]);

  if (!queue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const total = queue.length;
  const currentItem = queue[currentIndex];
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
  const newStreak = mockHomeData.streak_days + 1;

  function handleRate(_rating: number) {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswerRevealed(false);
    } else {
      setCompleted(true);
    }
  }

  // ── SCR-07d · All Done ──────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-5 py-10 text-center">
        <Sparkles size={32} strokeWidth={1.5} className="mb-3 text-gold" />
        <h1 className="mb-1 font-syne text-[24px] font-black text-white">All done!</h1>
        <p className="mb-8 font-dm-sans text-[12px] text-white/40">
          {total} {total === 1 ? 'topic' : 'topics'} reviewed · {elapsedMinutes}{' '}
          {elapsedMinutes === 1 ? 'minute' : 'minutes'}
        </p>

        {/* Streak card */}
        <div className="mb-6 w-full max-w-xs rounded-2xl border border-white/10 bg-white/10 px-6 py-5">
          <p className="mb-2 font-dm-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
            Streak
          </p>
          <div className="flex items-center justify-center gap-2">
            <Zap size={18} strokeWidth={1.5} className="text-gold" />
            <span className="font-syne text-[40px] font-black leading-none text-white">
              {newStreak}
            </span>
          </div>
          <p className="mt-1 font-dm-sans text-[11px] text-white/40">days in a row</p>
        </div>

        {/* Next review hint */}
        <p className="mb-8 w-full max-w-xs text-left font-dm-sans text-[11px] leading-relaxed text-white/30">
          Next reviews: Tomorrow → Quadratic Equations · In 4 days → Linear Equations
        </p>

        {/* Navigation */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => router.push('/student/learn')}
            className="rounded-xl bg-jade py-3.5 font-syne text-[14px] font-bold text-white active:opacity-90"
          >
            Browse More Topics →
          </button>
          <button
            onClick={() => router.push('/student')}
            className="rounded-xl border border-white/20 py-3.5 font-dm-sans text-[13px] font-semibold text-white/60 active:opacity-70"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── SCR-07b/c · Active question ─────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="px-4 pb-6 pt-4">

        {/* Top bar */}
        <div className="mb-5 flex items-center gap-2">
          {!answerRevealed && (
            <button
              onClick={() => router.push('/student/recall')}
              className="font-dm-sans text-[13px] font-semibold text-white/40 active:opacity-70"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>
          )}
          <p className="flex-1 font-syne text-[15px] font-bold text-white">
            Daily Recall
          </p>
          <span className="rounded-full bg-white/10 px-3 py-1 font-dm-sans text-[11px] text-white/60">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* SCR-07b — question card (full) / SCR-07c — collapsed */}
        {!answerRevealed ? (
          /* ── SCR-07b · Question hidden ── */
          <>
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-center">
              <p className="mb-3 font-dm-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
                {currentItem.subject} · {currentItem.topic_title}
              </p>
              <p className="font-syne text-[15px] font-bold leading-snug text-white">
                {currentItem.question}
              </p>
              <p className="mt-4 font-dm-sans text-[11px] text-white/30">
                Tap to reveal answer ↓
              </p>
            </div>

            <button
              onClick={() => setAnswerRevealed(true)}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 font-dm-sans text-[14px] font-bold text-white active:opacity-70"
            >
              Show Answer
            </button>
          </>
        ) : (
          /* ── SCR-07c · Answer revealed ── */
          <>
            {/* Collapsed question */}
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="font-dm-sans text-[12px] font-semibold leading-snug text-white/70">
                {currentItem.question}
              </p>
            </div>

            {/* Model answer card */}
            <div className="mb-4 rounded-xl bg-card px-4 py-4">
              <p className="mb-2 font-dm-sans text-[9px] font-bold uppercase tracking-wider text-muted">
                Model Answer
              </p>
              <p className="font-dm-sans text-[13px] leading-relaxed text-ink">
                {currentItem.model_answer}
              </p>
            </div>

            {/* Rating prompt */}
            <p className="mb-3 text-center font-dm-sans text-[11px] font-semibold text-white/50">
              How well did you remember this?
            </p>

            <QualityRating onRate={handleRate} />
          </>
        )}
      </div>
    </div>
  );
}
