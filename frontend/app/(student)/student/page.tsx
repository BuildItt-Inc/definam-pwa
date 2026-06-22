'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Calculator,
  FlaskConical,
  FileText,
  Zap,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getHomeData } from '@/lib/api/topics';
import type { HomeData, RecentTopic } from '@/types/topics';
import { RecallCard } from '@/components/student/RecallCard';
import { BottomNav } from '@/components/student/BottomNav';

// ── Helpers ────────────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  Chemistry: FlaskConical,
  'English Language': FileText,
  Physics: Zap,
  Economics: TrendingUp,
};

function subjectIcon(subject: string): LucideIcon {
  return SUBJECT_ICONS[subject] ?? BookOpen;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-ink px-4 pb-8 pt-5">
        <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="mb-1.5 h-7 w-44 animate-pulse rounded bg-white/20" />
        <div className="mb-4 h-3 w-52 animate-pulse rounded bg-white/10" />
        <div className="h-8 w-32 animate-pulse rounded-full bg-white/10" />
      </div>
      {/* Recall card */}
      <div className="-mt-3 px-3">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
      {/* Pills + topics */}
      <div className="mt-5 px-4">
        <div className="mb-4 flex gap-2">
          {[80, 56, 64, 52].map((w, i) => (
            <div
              key={i}
              className="h-7 animate-pulse rounded-full bg-gray-100"
              style={{ width: w }}
            />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-gray-100 py-3"
          >
            <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-[3px] w-[70px] animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Topic row ──────────────────────────────────────────────────────────────

function TopicRow({
  topic,
  isEmpty,
}: {
  topic: RecentTopic;
  isEmpty: boolean;
}) {
  const Icon = subjectIcon(topic.subject);
  const barFill = topic.mastery_percent >= 50 ? 'bg-jade' : 'bg-gray-400';

  return (
    <Link
      href={`/student/learn/${topic.topic_id}`}
      className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
    >
      {/* Subject icon */}
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <Icon size={14} strokeWidth={1.5} className="text-gray-500" />
      </span>

      {/* Info */}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-dm-sans text-[13px] font-bold text-ink">
          {topic.topic_title}
        </span>
        <span className="mt-0.5 block font-dm-sans text-[11px] text-gray-400">
          {topic.subject}
          {isEmpty ? ' · Not started' : ''}
        </span>
        {!isEmpty && (
          <span className="mt-1.5 block h-[3px] w-[70px] overflow-hidden rounded-full bg-gray-100">
            <span
              className={`block h-full rounded-full ${barFill}`}
              style={{ width: `${topic.mastery_percent}%` }}
            />
          </span>
        )}
      </span>

      {/* Right action */}
      {isEmpty ? (
        <span className="flex-shrink-0 rounded-[3px] bg-jade px-2 py-0.5 font-dm-sans text-[10px] font-bold text-white">
          Start →
        </span>
      ) : (
        <ChevronRight
          size={16}
          strokeWidth={1.5}
          className="flex-shrink-0 text-gray-300"
        />
      )}
    </Link>
  );
}

// ── Subject filter pills ───────────────────────────────────────────────────

const PILLS = ['All', 'Maths', 'English', 'Chem'] as const;

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activePill, setActivePill] = useState(0);
  const router = useRouter();

  useEffect(() => {
    getHomeData()
      .then(setData)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  /* Error state */
  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center font-dm-sans text-sm text-gray-500">
          {fetchError}
        </p>
      </div>
    );
  }

  /* Loading skeleton */
  if (!data) return <HomeSkeleton />;

  const { student_name, school_name, streak_days, recall_queue, recent_topics } = data;
  const hasQueue = recall_queue.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* ── SCR-04 · Dark header ─────────────────────────────────────────── */}
      <header className="bg-ink px-4 pb-7 pt-5">
        <p className="mb-0.5 font-dm-sans text-[11px] text-white/50">
          {getGreeting()}
        </p>
        <h1 className="mb-0.5 font-syne text-[22px] font-black leading-tight text-white">
          {student_name}
        </h1>
        <p className="mb-3 font-dm-sans text-[11px] text-white/40">{school_name}</p>

        {/* Streak pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
          <Flame size={16} strokeWidth={1.5} className="text-gold" />
          <span className="font-syne text-[18px] font-black leading-none text-white">
            {streak_days}
          </span>
          <span className="font-dm-sans text-[11px] text-white/50">
            {streak_days === 0 ? 'Start your streak!' : 'day streak'}
          </span>
        </div>
      </header>

      {/* ── Main scroll area ─────────────────────────────────────────────── */}
      <main className="flex-1 pb-20">

        {/* Recall card — negative margin pulls it over header bottom edge */}
        <div className="-mt-3 px-3">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/recall')}
          />
        </div>

        {hasQueue ? (
          /* ── SCR-04a · Browse Topics section ─────────────────────────── */
          <section className="mt-4">
            {/* Heading row */}
            <div className="mb-3 flex items-center justify-between px-4">
              <span className="font-dm-sans text-[13px] font-bold text-ink">
                Browse Topics
              </span>
              <Link
                href="/student/learn"
                className="font-dm-sans text-[12px] font-semibold text-jade"
              >
                See all
              </Link>
            </div>

            {/* Subject filter pills — visual selection only in V1 */}
            <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-0.5">
              {PILLS.map((pill, i) => (
                <button
                  key={pill}
                  onClick={() => setActivePill(i)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 font-dm-sans text-[11px] font-bold transition-colors ${
                    activePill === i
                      ? 'border-jade bg-jade text-white'
                      : 'border-gray-200 text-ink'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Recent topics */}
            <div>
              {recent_topics.map((topic) => (
                <TopicRow key={topic.topic_id} topic={topic} isEmpty={false} />
              ))}
            </div>
          </section>
        ) : (
          /* ── SCR-04b · Start here section ────────────────────────────── */
          <section className="mt-4">
            <p className="mb-2 px-4 font-dm-sans text-[13px] font-bold text-ink">
              Start here
            </p>
            <div>
              {recent_topics.map((topic) => (
                <TopicRow key={topic.topic_id} topic={topic} isEmpty={true} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Shared bottom navigation ─────────────────────────────────────── */}
      <BottomNav recallCount={recall_queue.length} />
    </div>
  );
}
