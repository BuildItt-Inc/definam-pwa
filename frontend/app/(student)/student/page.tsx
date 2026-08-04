'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { getHomeData, getSubjects } from '@/lib/api/topics';
import type { HomeData, RecentTopic, Subject } from '@/types/topics';
import { RecallCard } from '@/components/student/RecallCard';
import { CompletionRing } from '@/components/student/CompletionRing';
import { BottomNav } from '@/components/student/BottomNav';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { useSpotlight } from '@/hooks/useSpotlight';
import { subjectIcon, subjectColor } from '@/lib/utils/subjects';

// ── Helpers ────────────────────────────────────────────────────────────────

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
      <div
        className="relative overflow-hidden px-5 pb-11 pt-[calc(env(safe-area-inset-top)+24px)]"
        style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 130%)' }}
      >
        <div className="mb-1 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="mb-1 h-8 w-44 animate-pulse rounded bg-white/20" />
        <div className="mb-4 h-3 w-36 animate-pulse rounded bg-white/10" />
        <div className="flex items-center justify-between">
          <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-3.5 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[34px] w-[34px] animate-pulse rounded-[10px] bg-white/10" />
          ))}
        </div>
      </div>
      <div className="-mt-7 px-4">
        <div className="h-28 animate-pulse rounded-2xl bg-white border border-gray-200" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-white border border-gray-100" />
        ))}
      </div>
      <div className="mt-6 px-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white border border-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ── Topic row ──────────────────────────────────────────────────────────────

function TopicRow({ topic }: { topic: RecentTopic }) {
  const Icon = subjectIcon(topic.subject);
  const color = subjectColor(topic.subject);
  const { ref, onMouseMove } = useSpotlight<HTMLAnchorElement>();
  const progress = topic.mastery_percent ?? 0;
  const started = progress > 0;

  return (
    <Link
      ref={ref}
      onMouseMove={onMouseMove}
      href={`/student/learn/${topic.topic_id}`}
      className="spotlight spotlight-card relative flex items-center gap-3 overflow-hidden rounded-[14px] border border-[#F3F4F6] bg-white px-3 py-3"
    >
      {/* Subject icon */}
      <span
        className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: color.bg, color: color.fg }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>

      {/* Info + progress bar */}
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-[#111827]">
          {topic.topic_title}
        </span>
        <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#F3F4F6]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#4ADE80,#16A34A)' }}
          />
        </span>
        <span className="mt-1 block text-[11px] text-[#9CA3AF]">
          {topic.subject} &middot; {started ? `${progress}% done` : 'Not started'}
        </span>
      </span>

      {/* CTA — per-topic, not page-wide: each row reflects its own progress */}
      <span className="relative z-10 flex-shrink-0 rounded-[9px] bg-[#111827] px-3 py-1.5 text-[12px] font-bold text-white">
        {started ? 'Continue' : 'Start'}
      </span>
    </Link>
  );
}

// ── Subject strip ───────────────────────────────────────────────────────────

function SubjectStrip({ subjects }: { subjects: Subject[] }) {
  return (
    <div className="relative z-10 mt-3.5 flex gap-2">
      {subjects.map((subject) => {
        const Icon = subjectIcon(subject.name);
        return (
          <Link
            key={subject.name}
            href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
            aria-label={subject.name}
            title={subject.name}
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.08] text-white transition-colors hover:bg-white/[0.16]"
          >
            <Icon size={16} strokeWidth={1.8} />
          </Link>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Morning');
  const router = useRouter();
  const { celebrate } = useCelebration();
  const { ref: glowRef, onMouseMove: onGlowMouseMove } = useSpotlight<HTMLDivElement>();

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
    // Subject strip + "subjects covered" stat both need the real subject
    // list — already exposed via the existing /subjects endpoint (same one
    // Browse uses), so this isn't a new backend addition, just a second
    // consumer of it.
    getSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]));
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

  const { student_name, school_name, streak_days, completion_percent, recall_queue, recent_topics } = data;
  const hasStarted = recent_topics.some((t) => (t.mastery_percent ?? 0) > 0);
  const currentTopic = recent_topics[0];

  return (
    <div className="page-with-nav bg-[#F9FAFB] page-enter">

      {/* ── 1. Header ── */}
      <div
        ref={glowRef}
        onMouseMove={onGlowMouseMove}
        className="relative shrink-0 overflow-hidden px-5 pb-11 pt-[calc(env(safe-area-inset-top)+24px)]"
        style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 130%)' }}
      >
        {/* Fixed corner glow (not spotlight-following — a static accent, per
            the preview's .header-glow, distinct from the cursor-tracked
            spotlight used on cards/buttons elsewhere).*/}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.25), transparent 70%)' }}
        />

        <p className="relative z-10 mb-1 text-[13px] font-medium text-white/40 tracking-wide">
          {greeting}
        </p>
        <h1 className="relative z-10 mb-0.5 text-[26px] font-bold leading-tight text-white tracking-tight">
          {student_name}
        </h1>
        <p className="relative z-10 mb-[18px] text-[13px] text-white/40">{school_name}</p>

        {/* Streak + completion ring */}
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#4ADE80]/30 bg-white/10 px-3.5 py-2">
            <Flame size={15} strokeWidth={2} className="flame-pulse text-[#4ADE80]" />
            <span className="font-bold text-[15px] leading-none text-white">
              {streak_days}
            </span>
            <span className="text-[12.5px] text-white/55">
              {streak_days === 1 ? 'day streak' : streak_days === 0 ? 'Start your streak' : 'day streak'}
            </span>
          </div>
          <CompletionRing percent={completion_percent} />
        </div>

        {/* Subject strip — tappable, jumps straight to that subject's
            chapter list on Browse. */}
        {subjects && subjects.length > 0 && <SubjectStrip subjects={subjects} />}
      </div>

      {/* ── Main scroll area ── */}
      <main className="flex-1 px-4 pb-nav">

        {/* Recall card - floats over header bottom */}
        <div className="-mt-7 mb-4">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/review')}
          />
        </div>

        {/* Stats row */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white px-2 py-3 text-center">
            <div className="text-[18px] font-extrabold text-[#111827]">
              {subjects ? subjects.length : '—'}
            </div>
            <div className="mt-0.5 text-[10.5px] text-[#9CA3AF]">subjects</div>
          </div>
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white px-2 py-3 text-center">
            <div className="text-[18px] font-extrabold text-[#111827]">
              {currentTopic ? `${currentTopic.mastery_percent ?? 0}%` : '—'}
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-[#9CA3AF]">
              {currentTopic ? currentTopic.topic_title : 'No topic yet'}
            </div>
          </div>
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white px-2 py-3 text-center">
            <div className="text-[18px] font-extrabold text-[#111827]">{streak_days}</div>
            <div className="mt-0.5 text-[10.5px] text-[#9CA3AF]">day streak</div>
          </div>
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
              <TopicRow key={topic.topic_id} topic={topic} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav recallCount={recall_queue.length} />
    </div>
  );
}
