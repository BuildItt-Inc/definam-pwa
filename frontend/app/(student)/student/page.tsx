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
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { useSpotlight } from '@/hooks/useSpotlight';
import { SUBJECT_ICONS, subjectIcon, subjectColor } from '@/lib/utils/subjects';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  getStudentProfile,
  getSelectedSubjectNames,
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
    <div className="min-h-screen bg-bg-0 md:max-w-5xl md:mx-auto md:px-6 md:pt-7">
      <div className="rounded-b-3xl md:rounded-2xl bg-ink px-5 pb-6 pt-[calc(env(safe-area-inset-top,0px)+24px)] md:px-7 md:py-6">
        <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="mb-1.5 h-8 w-44 animate-pulse rounded bg-white/20" />
        <div className="mb-5 h-3 w-36 animate-pulse rounded bg-white/10" />
        <div className="flex items-center justify-between">
          <div className="h-9 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="mt-4 px-4 md:px-0">
        <div className="h-24 animate-pulse rounded-2xl bg-card border border-border" />
      </div>
      <div className="mt-4 px-4 md:px-0 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-card border border-border" />
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

// ── Your Subjects Strip (below hero — clean mobile & desktop tiles) ──────────

function YourSubjectsCard({ subjects }: { subjects: Subject[] }) {
  const mappedSubjects = subjects.filter((s) => s.name in SUBJECT_ICONS).slice(0, 7);
  if (mappedSubjects.length === 0) return null;

  return (
    <section className="mt-4 px-4 md:px-0">
      <div className="md:rounded-2xl md:border md:border-border md:bg-card md:px-5 md:py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15.5px] font-bold text-ink tracking-tight">Your subjects</h2>
          <Link
            href="/student/subjects"
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            <span className="md:hidden">Edit</span>
            <span className="hidden md:inline">Manage</span>
          </Link>
        </div>
        <div className="flex items-start gap-3 md:gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {mappedSubjects.map((subject) => {
            const Icon = subjectIcon(subject.name);
            const shortLabel = subject.name === 'Mathematics' ? 'Maths' : subject.name.split(' ')[0];
            return (
              <Link
                key={subject.name}
                href={`/student/learn/${encodeURIComponent(subject.name)}?view=chapters&name=${encodeURIComponent(subject.name)}`}
                title={subject.name}
                className="group flex w-[64px] md:flex-1 md:min-w-[76px] flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border border-transparent py-1 md:py-2 md:hover:border-border md:hover:bg-bg-0 transition-all active:scale-95"
              >
                <span className="flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-2xl md:rounded-xl border border-border bg-card md:bg-bg-0 text-ink-2 group-hover:text-brand group-hover:border-brand/30 transition-colors shadow-2xs md:shadow-none">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="truncate max-w-full text-[11.5px] font-medium text-muted group-hover:text-ink text-center">
                  {shortLabel}
                </span>
              </Link>
            );
          })}
          <Link
            href="/student/subjects"
            aria-label="Edit subjects"
            className="group flex w-[64px] md:flex-1 md:min-w-[76px] flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border border-transparent py-1 md:py-2 md:hover:border-border md:hover:bg-bg-0 transition-all active:scale-95"
          >
            <span className="flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-2xl md:rounded-xl border border-dashed border-border-2 bg-card md:bg-bg-0 text-muted group-hover:text-ink transition-colors">
              <Plus size={18} strokeWidth={2} />
            </span>
            <span className="text-[11.5px] font-medium text-muted group-hover:text-ink text-center">
              Edit
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const [data, setData] = useState<HomeData | null>(() => getCachedHomeData());
  const [subjects, setSubjects] = useState<Subject[] | null>(() => getCachedSubjects());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Good morning');
  const router = useRouter();
  const { celebrate } = useCelebration();
  const { ref: glowRef, onMouseMove: onGlowMouseMove } = useSpotlight<HTMLDivElement>();
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
    getHomeData()
      .then((homeData) => {
        setData(homeData);
        if (typeof window !== 'undefined' && homeData.recall_queue) {
          const filteredCount = filterTopicsByProfile(homeData.recall_queue, getStudentProfile()).length;
          window.dispatchEvent(new CustomEvent('recallQueueUpdated', { detail: filteredCount }));
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
      .catch(() => setSubjects([]));
  }, [router, celebrate]);

  if (fetchError && !data) {
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
  const displayName = profile?.name || student_name;

  // Filter subjects and topics to the student's selected curriculum
  const displaySubjects = subjects ? filterSubjectsByProfile(subjects, profile) : null;
  const displayTopics = filterTopicsByProfile(recent_topics, profile);
  const hasStarted = displayTopics.some((t) => (t.mastery_percent ?? 0) > 0);

  return (
    <div className="page-with-nav bg-bg-0 page-enter md:max-w-5xl md:mx-auto md:px-6 md:pt-7 md:pb-10">

      {/* ── 1. Hero Header (standard crisp dark ink card, no gradient glow) ── */}
      <div
        ref={glowRef}
        onMouseMove={onGlowMouseMove}
        className="relative shrink-0 overflow-hidden rounded-b-3xl bg-ink px-5 pb-6 pt-[calc(env(safe-area-inset-top,0px)+24px)] md:rounded-2xl md:px-7 md:py-6"
      >
        <div className="relative z-10 flex items-center justify-between gap-4 md:gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs font-medium text-white/55 tracking-wide">
              {greeting}
            </p>
            <h1 className="mb-0.5 truncate text-[26px] md:text-[30px] font-bold leading-tight text-white tracking-tight">
              {displayName}
            </h1>
            {profile?.class_level ? (
              <p className="mb-4 text-[13px] md:text-sm text-white/55">
                {profile.class_level}{profile.targets?.length ? ` · ${profile.targets.join(', ')}` : ''}{school_name ? ` · ${school_name}` : ''}
              </p>
            ) : school_name ? (
              <p className="mb-4 text-[13px] md:text-sm text-white/45">{school_name}</p>
            ) : (
              <div className="mb-4" />
            )}

            {/* Streak pill + mobile completion ring */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2">
                <Flame size={15} strokeWidth={2} className="flame-pulse text-brand-light" />
                <span className="font-bold text-base leading-none text-white">
                  {streak_days}
                </span>
                <span className="text-xs text-white/65">
                  {streak_days === 0 ? 'Start your streak' : 'day streak'}
                </span>
              </div>
              <div className="md:hidden">
                <CompletionRing percent={completion_percent} />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-1 pr-2">
            <CompletionRing percent={completion_percent} />
            <span className="text-[11px] font-medium text-white/60">Overall</span>
          </div>
        </div>
      </div>

      {/* ── Your subjects clean icon strip ── */}
      {displaySubjects && displaySubjects.length > 0 && (
        <YourSubjectsCard subjects={displaySubjects} />
      )}

      {/* ── 2. Main content grid (single column on mobile, 2 columns on desktop) ── */}
      <main className="flex-1 px-4 md:px-0 pb-nav md:pb-0 md:mt-4 md:grid md:grid-cols-[1.25fr_1fr] md:gap-4 md:items-start">

        {/* Mobile-only Recall card */}
        <div className="mt-4 mb-4 md:hidden">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/review')}
          />
        </div>

        {/* PWA install banner (spans across mobile, sits top of left col on desktop) */}
        <div className="min-w-0">
          {canInstall && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] border border-border bg-white p-3.5 shadow-xs">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">Install Recall App</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">
                  Add Recall to your home screen for quick, one-tap access.
                </p>
              </div>
              <button
                onClick={promptInstall}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <Download size={13} strokeWidth={2.5} />
                Install
              </button>
            </div>
          )}

          <AppInstallModal
            isOpen={showInstallModal}
            onClose={() => setShowInstallModal(false)}
          />

          {/* Stats row — only on mobile (desktop has the right panel) */}
          <div className="mb-5 grid grid-cols-2 gap-2 md:hidden">
            <Link
              href="/student/subjects"
              aria-label="Manage your subjects"
              className="group rounded-[14px] border border-border bg-white px-3 py-3.5 text-center transition-all hover:border-ink/20 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-1 text-xl font-extrabold text-ink">
                <span>{displaySubjects ? displaySubjects.length : (profile?.selectedSubjects?.length || '—')}</span>
                <ChevronRight size={14} className="text-muted group-hover:text-ink transition-colors" />
              </div>
              <div className="mt-0.5 text-xs text-muted">my subjects · edit</div>
            </Link>
            <div className="rounded-[14px] border border-border bg-white px-3 py-3.5 text-center">
              <div className="text-xl font-extrabold text-ink">
                {completion_percent}%
              </div>
              <div className="mt-0.5 text-xs text-muted">overall done</div>
            </div>
          </div>

          {/* Topics / Start here section */}
          <section className="mb-6 md:mb-0">
            <div className="mb-3 flex items-center justify-between md:hidden">
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

            {displayTopics.length > 0 ? (
              <div className="rounded-2xl md:border md:border-border md:bg-card md:p-5">
                <div className="hidden md:flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {hasStarted ? 'Continue studying' : 'Start here'}
                  </span>
                  <Link
                    href="/student/learn"
                    className="text-[12.5px] font-semibold text-brand hover:underline"
                  >
                    Browse all
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {displayTopics.map((topic) => (
                    <TopicRow key={topic.topic_id} topic={topic} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 text-center md:text-left">
                <p className="hidden md:block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Start here
                </p>
                <p className="text-sm md:text-[18px] font-bold text-ink">Ready to begin?</p>
                <p className="text-xs md:text-[13.5px] text-muted mt-1 max-w-[320px] mx-auto md:mx-0 leading-relaxed">
                  Explore your selected subjects and start your first topic to build your recall streak.
                </p>
                <Link
                  href="/student/learn"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand md:bg-ink px-4 py-2.5 text-xs md:text-[13px] font-bold text-white shadow-xs hover:opacity-90 transition-all"
                >
                  <span>Open my subjects</span>
                  <ChevronRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* ── Right column: Recall status + 2-up stats (desktop only) ── */}
        <aside className="hidden md:flex flex-col gap-3">
          <RecallCard
            queue={recall_queue}
            onStart={() => router.push('/student/review')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/student/subjects"
              aria-label="Manage your subjects"
              className="group rounded-2xl border border-border bg-card px-4 py-4 transition-all hover:border-ink/20 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl font-extrabold text-ink">
                  {displaySubjects ? displaySubjects.length : (profile?.selectedSubjects?.length || '—')}
                </span>
                <ChevronRight size={14} className="text-muted group-hover:text-ink transition-colors" />
              </div>
              <p className="text-[12px] text-muted">My subjects</p>
            </Link>

            <div className="rounded-2xl border border-border bg-card px-4 py-4">
              <div className="text-2xl font-extrabold text-ink mb-1">
                {completion_percent}%
              </div>
              <p className="text-[12px] text-muted">Overall done</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
