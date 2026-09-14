'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Download } from 'lucide-react';
import { getHomeData, getSubjects } from '@/lib/api/topics';
import type { HomeData, RecentTopic, Subject } from '@/types/topics';
import { RecallCard } from '@/components/student/RecallCard';
import { CompletionRing } from '@/components/student/CompletionRing';
import { BottomNav } from '@/components/student/BottomNav';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { useSpotlight } from '@/hooks/useSpotlight';
import { SUBJECT_ICONS, subjectIcon, subjectColor } from '@/lib/utils/subjects';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { IOSInstallModal } from '@/components/ui/IOSInstallModal';

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div
        className="relative overflow-hidden px-5 pb-11 pt-[calc(env(safe-area-inset-top,0px)+24px)]"
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
        <div className="h-28 animate-pulse rounded-2xl bg-white border border-border" />
      </div>
      <div className="mt-4 px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white border border-border" />
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
      className="spotlight spotlight-card relative flex items-center gap-3 overflow-hidden rounded-[14px] border border-border bg-white px-3 py-3 active:scale-[0.99] transition-transform"
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
        <span className="block truncate text-sm font-bold text-ink">
          {topic.topic_title}
        </span>
        <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-bg-2">
          <span
            className="block h-full rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4ADE80, #16A34A)' }}
          />
        </span>
        <span className="mt-1 block text-xs text-faint">
          {topic.subject} · {started ? `${progress}% done` : 'Not started'}
        </span>
      </span>

      {/* CTA */}
      <span className="relative z-10 flex-shrink-0 rounded-[9px] bg-ink px-3 py-1.5 text-xs font-bold text-white">
        {started ? 'Continue' : 'Start'}
      </span>
    </Link>
  );
}

// ── Subject strip ───────────────────────────────────────────────────────────

function SubjectStrip({ subjects }: { subjects: Subject[] }) {
  const mappedSubjects = subjects.filter((s) => s.name in SUBJECT_ICONS).slice(0, 5);

  return (
    <div className="relative z-10 mt-3.5 flex gap-2">
      {mappedSubjects.map((subject) => {
        const Icon = subjectIcon(subject.name);
        return (
          <Link
            key={subject.name}
            href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
            aria-label={subject.name}
            title={subject.name}
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.08] text-white active:bg-white/[0.16] transition-colors"
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
  const [greeting, setGreeting] = useState('Good morning');
  const router = useRouter();
  const { celebrate } = useCelebration();
  const { ref: glowRef, onMouseMove: onGlowMouseMove } = useSpotlight<HTMLDivElement>();
  const {
    canInstall,
    promptInstall,
    showIOSInstructions,
    setShowIOSInstructions,
  } = usePWAInstall();

  useEffect(() => {
    setGreeting(getGreeting());
    getHomeData()
      .then((homeData) => {
        setData(homeData);
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
    getSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, [router, celebrate]);

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-bg-0">
        <div className="text-center">
          <p className="text-base text-muted mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-brand underline underline-offset-2"
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

  return (
    <div className="page-with-nav bg-bg-0 page-enter">

      {/* ── 1. Hero Header ── */}
      <div
        ref={glowRef}
        onMouseMove={onGlowMouseMove}
        className="relative shrink-0 overflow-hidden px-5 pb-12 pt-[calc(env(safe-area-inset-top,0px)+24px)]"
        style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 130%)' }}
      >
        {/* Static corner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.22), transparent 70%)' }}
        />

        <p className="relative z-10 mb-0.5 text-xs font-medium text-white/50 tracking-wide">
          {greeting}
        </p>
        <h1 className="relative z-10 mb-0.5 text-[26px] font-bold leading-tight text-white tracking-tight">
          {student_name}
        </h1>
        {school_name && (
          <p className="relative z-10 mb-5 text-sm text-white/40">{school_name}</p>
        )}

        {/* Streak pill + completion ring — streak shown once only here */}
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-light/30 bg-white/10 px-3.5 py-2">
            <Flame size={15} strokeWidth={2} className="flame-pulse text-brand-light" />
            <span className="font-bold text-base leading-none text-white">
              {streak_days}
            </span>
            <span className="text-xs text-white/55">
              {streak_days === 0 ? 'Start your streak' : streak_days === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>
          <CompletionRing percent={completion_percent} />
        </div>

        {/* Subject shortcut strip */}
        {subjects && subjects.length > 0 && <SubjectStrip subjects={subjects} />}
      </div>

      {/* ── 2. Main scroll area ── */}
      <main className="flex-1 px-4 pb-nav">

        {/* Recall card — floats over header */}
        <div className="-mt-7 mb-4">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/review')}
          />
        </div>

        {/* PWA install banner */}
        {canInstall && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] border border-border bg-white p-3.5 shadow-xs">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Install Recall App</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">
                Add to your home screen for fast, offline access.
              </p>
            </div>
            <button
              onClick={promptInstall}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
            >
              <Download size={13} strokeWidth={2.5} />
              Install
            </button>
          </div>
        )}

        <IOSInstallModal
          isOpen={showIOSInstructions}
          onClose={() => setShowIOSInstructions(false)}
        />

        {/* Stats row — removed duplicate streak; shows subjects + top topic mastery */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] border border-border bg-white px-3 py-3.5 text-center">
            <div className="text-xl font-extrabold text-ink">
              {subjects ? subjects.length : '—'}
            </div>
            <div className="mt-0.5 text-xs text-muted">subjects</div>
          </div>
          <div className="rounded-[14px] border border-border bg-white px-3 py-3.5 text-center">
            <div className="text-xl font-extrabold text-ink">
              {completion_percent}%
            </div>
            <div className="mt-0.5 text-xs text-muted">overall done</div>
          </div>
        </div>

        {/* Topics section */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-ink">
              {hasStarted ? 'Continue studying' : 'Start here'}
            </span>
            <Link
              href="/student/learn"
              className="text-sm font-semibold text-brand active:opacity-70 transition-opacity"
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
