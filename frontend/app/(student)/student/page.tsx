'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Download, Plus, ChevronRight } from 'lucide-react';
import { handleAuthError } from '@/lib/api/auth';
import { getHomeData, getSubjects, getCachedHomeData, getCachedSubjects } from '@/lib/api/topics';
import type { HomeData, RecentTopic, Subject } from '@/types/topics';
import { RecallCard } from '@/components/student/RecallCard';
import { CompletionRing } from '@/components/student/CompletionRing';
import { AskZikoraButton } from '@/components/student/FloatingChat/FloatingChatWidget';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { SUBJECT_ICONS, subjectIcon } from '@/lib/utils/subjects';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  getStudentProfile,
  filterSubjectsByProfile,
  filterTopicsByProfile,
  type StudentProfile,
} from '@/lib/utils/studentProfile';
import { AppInstallModal } from '@/components/ui/AppInstallModal';

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
      <div className="border-b border-border bg-card px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-bg-2" />
            <div className="h-7 w-40 animate-pulse rounded bg-bg-3" />
            <div className="h-3 w-32 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-bg-2" />
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Topic row ──────────────────────────────────────────────────────────────

function TopicRow({ topic }: { topic: RecentTopic }) {
  const Icon = subjectIcon(topic.subject);
  const progress = topic.mastery_percent ?? 0;
  const started = progress > 0;

  return (
    <Link
      href={`/student/learn/${topic.topic_id}`}
      className="flex min-h-[60px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-bg-0 active:bg-bg-2"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-bg-2 text-ink-2">
        <Icon size={18} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-bold text-ink">
          {topic.topic_title}
        </span>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-bg-2">
          <span
            className="block h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </span>
        <span className="mt-1 block text-xs text-muted">
          {topic.subject} · {started ? `${progress}% done` : 'Not started'}
        </span>
      </span>

      <span
        className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
          started
            ? 'border border-border bg-card text-ink'
            : 'bg-ink text-white'
        }`}
      >
        {started ? 'Continue' : 'Start'}
      </span>
    </Link>
  );
}

// ── Subject strip ───────────────────────────────────────────────────────────

function SubjectStrip({ subjects }: { subjects: Subject[] }) {
  const mappedSubjects = subjects.filter((s) => s.name in SUBJECT_ICONS).slice(0, 6);

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {mappedSubjects.map((subject) => {
        const Icon = subjectIcon(subject.name);
        return (
          <Link
            key={subject.name}
            href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
            aria-label={subject.name}
            title={subject.name}
            className="inline-flex h-9 items-center gap-1.5 flex-shrink-0 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-ink hover:bg-bg-2 active:scale-[0.97] transition-all"
          >
            <Icon size={14} strokeWidth={1.9} className="text-ink-2" />
            <span className="max-w-[96px] truncate">{subject.name}</span>
          </Link>
        );
      })}
      <Link
        href="/student/subjects"
        aria-label="Add or remove subjects"
        title="Add or remove subjects"
        className="inline-flex h-9 flex-shrink-0 items-center gap-1 rounded-lg border border-border bg-bg-2 px-2.5 text-xs font-semibold text-ink hover:bg-bg-3 active:scale-[0.97] transition-all"
      >
        <Plus size={14} strokeWidth={2.3} />
        <span>Edit</span>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const [data, setData] = useState<HomeData | null>(() => getCachedHomeData());
  const [subjects, setSubjects] = useState<Subject[] | null>(() => getCachedSubjects());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [greeting, setGreeting] = useState('Good morning');
  const router = useRouter();
  const { celebrate } = useCelebration();
  const {
    canInstall,
    promptInstall,
    showInstallModal,
    setShowInstallModal,
  } = usePWAInstall();

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

  useEffect(() => {
    setGreeting(getGreeting());
    setFetchError(null);
    getHomeData()
      .then((homeData) => {
        setData(homeData);
        if (typeof window !== 'undefined' && homeData.recall_queue) {
          window.dispatchEvent(new CustomEvent('recallQueueUpdated', { detail: homeData.recall_queue.length }));
        }
        if (sessionStorage.getItem('celebrate_login') === '1') {
          sessionStorage.removeItem('celebrate_login');
          celebrate({ type: 'login', name: homeData.student_name });
        }
      })
      .catch((err: unknown) => {
        if (!handleAuthError(err, router)) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load');
        }
      });
    getSubjects()
      .then(setSubjects)
      .catch(() => setSubjects((prev) => prev ?? []));
  }, [router, celebrate, retryTick]);

  if (fetchError && !data) {
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

  if (!data) return <HomeSkeleton />;

  const { student_name, school_name, streak_days, completion_percent, recall_queue, recent_topics } = data;
  const displayName = profile?.name || student_name;

  // Filter subjects and topics to the student's selected curriculum
  const displaySubjects = subjects ? filterSubjectsByProfile(subjects, profile) : null;
  const displayTopics = filterTopicsByProfile(recent_topics, profile);
  const hasStarted = displayTopics.some((t) => (t.mastery_percent ?? 0) > 0);

  return (
    <div className="page-with-nav bg-bg-0 page-enter">

      {/* ── 1. Clean Executive Header (no overlapping cards underneath) ── */}
      <header className="border-b border-border bg-card px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">
              {greeting}
            </p>
            <h1 className="truncate text-[24px] font-bold leading-tight tracking-tight text-ink">
              {displayName}
            </h1>
            {profile?.class_level ? (
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {profile.class_level}{profile.targets?.length ? ` · ${profile.targets.join(', ')}` : ''}{school_name ? ` · ${school_name}` : ''}
              </p>
            ) : school_name ? (
              <p className="mt-0.5 truncate text-[13px] text-muted">{school_name}</p>
            ) : null}
          </div>

          <AskZikoraButton className="shrink-0 mt-0.5" />
        </div>
      </header>

      {/* ── 2. Main scroll area ── */}
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 pt-4 pb-nav">

        {/* Streak & Overall Progress strip */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <Flame size={18} strokeWidth={2} className={streak_days > 0 ? 'flame-pulse' : ''} />
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight text-ink">
                {streak_days} {streak_days === 1 ? 'day' : 'days'} streak
              </p>
              <p className="text-xs text-muted">
                {streak_days === 0 ? 'Complete a topic to start your streak' : 'Keep showing up daily'}
              </p>
            </div>
          </div>
          <CompletionRing percent={completion_percent} />
        </div>

        {/* Subject shortcut strip */}
        {displaySubjects && displaySubjects.length > 0 && <SubjectStrip subjects={displaySubjects} />}

        {/* Recall card — sits cleanly in normal flow below the header */}
        <RecallCard
          queue={recall_queue}
          onStart={() => router.push('/student/review')}
        />

        {/* PWA install banner */}
        {canInstall && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Install Recall App</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">
                Add Recall to your home screen for quick, one-tap access.
              </p>
            </div>
            <button
              type="button"
              onClick={promptInstall}
              className="btn-primary min-h-[38px] px-3.5 py-1.5 text-xs flex-shrink-0"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Install</span>
            </button>
          </div>
        )}

        <AppInstallModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />

        {/* Stats row — live counts only */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/student/subjects"
            aria-label="Manage your subjects"
            className="group rounded-xl border border-border bg-card px-3.5 py-3.5 transition-colors hover:bg-bg-0 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-ink">
                {displaySubjects ? displaySubjects.length : (profile?.selectedSubjects?.length || '—')}
              </span>
              <ChevronRight size={15} className="text-muted transition-colors group-hover:text-ink" />
            </div>
            <div className="mt-0.5 text-xs text-muted">My subjects · edit</div>
          </Link>
          <div className="rounded-xl border border-border bg-card px-3.5 py-3.5">
            <div className="text-xl font-bold text-brand">
              {completion_percent}%
            </div>
            <div className="mt-0.5 text-xs text-muted">Overall progress</div>
          </div>
        </div>

        {/* Topics section */}
        <section className="pb-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-ink">
              {hasStarted ? 'Continue studying' : 'Start here'}
            </span>
            <Link
              href="/student/learn"
              className="text-[13px] font-semibold text-brand hover:underline underline-offset-4 active:opacity-70"
            >
              All subjects
            </Link>
          </div>

          {displayTopics.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {displayTopics.map((topic) => (
                <TopicRow key={topic.topic_id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <p className="text-sm font-bold text-ink">Ready to begin?</p>
              <p className="mx-auto mt-1 max-w-[280px] text-xs text-muted leading-relaxed">
                Explore your selected subjects and start your first topic to build your recall streak.
              </p>
              <Link
                href="/student/learn"
                className="btn-primary mt-3.5 inline-flex text-xs px-4"
              >
                Open My Subjects
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
