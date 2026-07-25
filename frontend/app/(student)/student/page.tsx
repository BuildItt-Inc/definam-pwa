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
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';

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
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#111827] px-5 pb-10 pt-[calc(env(safe-area-inset-top)+24px)]">
        <div className="mb-1 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="mb-1 h-8 w-44 animate-pulse rounded bg-white/20" />
        <div className="mb-5 h-3 w-36 animate-pulse rounded bg-white/10" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="-mt-4 px-4">
        <div className="h-28 animate-pulse rounded-2xl bg-white border border-gray-200" />
      </div>
      <div className="mt-6 px-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white border border-gray-100" />
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

  return (
    <Link
      href={`/student/learn/${topic.topic_id}`}
      className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] px-4 py-3.5 hover:border-[#16A34A]/30 hover:shadow-sm transition-all"
    >
      {/* Subject icon */}
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
        <Icon size={15} strokeWidth={1.8} className="text-[#16A34A]" />
      </span>

      {/* Info */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[#111827]">
          {topic.topic_title}
        </span>
        <span className="mt-0.5 block text-[13px] text-[#9CA3AF]">
          {topic.subject}
          {isEmpty ? '' : topic.mastery_percent > 0 ? ` · ${topic.mastery_percent}% done` : ' · Not started'}
        </span>
      </span>

      {/* Right */}
      {isEmpty ? (
        <span className="flex-shrink-0 rounded-lg bg-[#111827] px-3 py-1.5 text-[12px] font-semibold text-white">
          Start
        </span>
      ) : (
        <ChevronRight size={16} strokeWidth={1.5} className="flex-shrink-0 text-[#D1D5DB]" />
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Morning');
  const router = useRouter();
  const { celebrate } = useCelebration();

  useEffect(() => {
    setGreeting(getGreeting());
    getHomeData()
      .then((homeData) => {
        setData(homeData);
        // Set by the login page right before redirecting here — every
        // session, no manual dismiss needed (auto-dismisses on its own).
        if (sessionStorage.getItem('celebrate_login') === '1') {
          sessionStorage.removeItem('celebrate_login');
          celebrate({ type: 'login', name: homeData.student_name });
        }
      })
      .catch((err: unknown) => {
        const is401 =
          err instanceof Error &&
          (err.message === 'Not authenticated' || (err as { status?: number }).status === 401);
        if (is401) {
          router.replace('/login');
        } else {
          setFetchError(err instanceof Error ? err.message : 'Failed to load');
        }
      });
  }, [router, celebrate]);

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-[#F9FAFB]">
        <div className="text-center">
          <p className="text-[15px] text-[#6B7280] mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[14px] font-semibold text-[#16A34A] underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <HomeSkeleton />;

  const { student_name, school_name, streak_days, recall_queue, recent_topics } = data;
  const hasStarted = recent_topics.some((t) => (t.mastery_percent ?? 0) > 0);

  return (
    <div className="page-with-nav bg-[#F9FAFB] page-enter">

      {/* ── 1. Header ── */}
      <div className="bg-[#111827] px-5 pb-10 pt-[calc(env(safe-area-inset-top)+24px)]">
        <p className="mb-1 text-[13px] font-medium text-white/40 tracking-wide">
          {greeting}
        </p>
        <h1 className="mb-0.5 text-[26px] font-bold leading-tight text-white tracking-tight">
          {student_name}
        </h1>
        <p className="mb-5 text-[13px] text-white/40">{school_name}</p>

        {/* Streak */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
          <Flame size={15} strokeWidth={2} className="text-[#4ADE80]" />
          <span className="font-bold text-[15px] leading-none text-white">
            {streak_days}
          </span>
          <span className="text-[13px] text-white/50">
            {streak_days === 1 ? 'day streak' : streak_days === 0 ? 'Start your streak' : 'day streak'}
          </span>
        </div>
      </div>

      {/* ── Main scroll area ── */}
      <main className="flex-1 px-4 pb-nav">

        {/* Recall card - floats over header bottom */}
        <div className="-mt-4 mb-6">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/review')}
          />
        </div>

        {/* Topics section */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#111827]">
              {hasStarted ? 'Continue studying' : 'Start here'}
            </span>
            <Link
              href="/student/learn"
              className="text-[13px] font-semibold text-[#16A34A] hover:text-[#15803D] transition-colors"
            >
              Browse all
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recent_topics.map((topic) => (
              <TopicRow key={topic.topic_id} topic={topic} isEmpty={!hasStarted} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav recallCount={recall_queue.length} />
    </div>
  );
}
