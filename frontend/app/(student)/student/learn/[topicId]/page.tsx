'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, BookOpen, Bot, MessageSquare } from 'lucide-react';
import { getChapters, getTopics, getTopicDetail } from '@/lib/api/topics';
import type { Chapter, Topic, TopicDetail } from '@/types/topics';
import { TopicListItem } from '@/components/student/TopicListItem';
import { BottomNav } from '@/components/student/BottomNav';
import { LearningStep } from '@/components/student/LearningStep';
import { PracticeQuestion } from '@/components/student/PracticeQuestion';

// ── Shared helpers ─────────────────────────────────────────────────────────

function MasteryBadge({ mastery }: { mastery: number | null }) {
  if (mastery === null || mastery === 0) {
    return (
      <span className="flex-shrink-0 rounded-[3px] border border-gray-300 px-2 py-0.5 font-dm-sans text-[10px] font-bold text-gray-500">
        —
      </span>
    );
  }
  if (mastery >= 60) {
    return (
      <span className="flex-shrink-0 rounded-[3px] bg-jade px-2 py-0.5 font-dm-sans text-[10px] font-bold text-white">
        {mastery}%
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-[3px] bg-gray-500 px-2 py-0.5 font-dm-sans text-[10px] font-bold text-white">
      {mastery}%
    </span>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-5 w-8 animate-pulse rounded-[3px] bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <BookOpen size={32} strokeWidth={1.5} className="mb-3 text-gray-300" />
      <p className="font-dm-sans text-[13px] text-gray-400">{message}</p>
    </div>
  );
}

// ── Suspense fallback — used while searchParams resolve ────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 px-4 py-3.5">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <ListSkeleton />
    </div>
  );
}

// ── SCR-05b · Chapters view ────────────────────────────────────────────────

function ChaptersView({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setChapters(null);
    setFetchError(null);
    getChapters(subjectId)
      .then(setChapters)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [subjectId]);

  if (fetchError) {
    return (
      <div className="px-4 py-6 text-center font-dm-sans text-sm text-gray-500">
        {fetchError}
      </div>
    );
  }

  if (!chapters) return <ListSkeleton />;
  if (chapters.length === 0) return <EmptyState message="No chapters found for this subject." />;

  return (
    <>
      <p className="px-4 py-1.5 font-dm-sans text-[11px] text-gray-400">
        SS2 Syllabus · {chapters.length} chapters
      </p>
      <div>
        {chapters.map((chapter) => {
          const inProgress = chapter.mastery_percent !== null;
          return (
            <button
              key={chapter.id}
              onClick={() =>
                router.push(
                  `/student/learn/${subjectId}?view=topics&chapterId=${chapter.id}&name=${encodeURIComponent(chapter.title)}&subject=${encodeURIComponent(subjectName)}`,
                )
              }
              className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 active:bg-gray-50 ${
                inProgress ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-dm-sans text-[13px] font-bold text-ink">
                  {chapter.title}
                </span>
                <span className="mt-0.5 block font-dm-sans text-[11px] text-gray-400">
                  {chapter.topic_count} topics{inProgress ? ' · In Progress' : ''}
                </span>
              </span>
              <MasteryBadge mastery={chapter.mastery_percent} />
              <ChevronRight size={16} strokeWidth={1.5} className="flex-shrink-0 text-gray-300" />
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── SCR-05c · Topics view ──────────────────────────────────────────────────

function TopicsView({ chapterId }: { chapterId: string }) {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTopics(null);
    setFetchError(null);
    getTopics(chapterId)
      .then(setTopics)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [chapterId]);

  if (fetchError) {
    return (
      <div className="px-4 py-6 text-center font-dm-sans text-sm text-gray-500">
        {fetchError}
      </div>
    );
  }

  if (!topics) return <ListSkeleton />;
  if (topics.length === 0) return <EmptyState message="No topics found in this chapter." />;

  return (
    <>
      <p className="px-4 py-1.5 font-dm-sans text-[11px] text-gray-400">
        {topics.length} topics · WAEC-aligned
      </p>
      <div>
        {topics.map((topic) => (
          <TopicListItem
            key={topic.id}
            topic={topic}
            onClick={() =>
              router.push(
                `/student/learn/${topic.id}?title=${encodeURIComponent(topic.title)}`,
              )
            }
          />
        ))}
      </div>
    </>
  );
}

// ── Learning flow ──────────────────────────────────────────────────────────

const STEP_LABELS = ['Def', 'Example', 'Visual', 'Practice', 'Chat'] as const;

const STEP_CTA: Record<1 | 2 | 3, string> = {
  1: 'See a Nigerian Example',
  2: 'Continue to Visual',
  3: 'Continue to Practice',
};

function getStepContent(detail: TopicDetail, step: 1 | 2 | 3) {
  if (step === 1) return detail.step1;
  if (step === 2) return detail.step2;
  return detail.step3;
}

// ── Learning flow skeleton ──────────────────────────────────────────────────

function LearningFlowSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-ink px-4 pb-2.5 pt-3">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-white/20" />
          <div className="h-3 flex-1 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-8 animate-pulse rounded bg-white/10" />
        </div>
        <div className="mb-1.5 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[3px] flex-1 animate-pulse rounded-full bg-white/20" />
          ))}
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2 flex-1 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex-1 bg-cream px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-3 h-28 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

// ── Top bar for steps 1–4 ──────────────────────────────────────────────────

function LearningTopBar({
  step,
  showScoreSummary,
  topicTitle,
  questionIndex,
  totalQuestions,
  onBack,
  onExit,
}: {
  step: 1 | 2 | 3 | 4 | 5;
  showScoreSummary: boolean;
  topicTitle: string;
  questionIndex: number;
  totalQuestions: number;
  onBack: () => void;
  onExit: () => void;
}) {
  const isPracticeStep = step === 4;

  return (
    <div className="bg-ink px-4 pb-2.5 pt-3">
      {/* Navigation row */}
      <div className="mb-2.5 flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex-shrink-0 text-white/50 active:text-white/80"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>

        {isPracticeStep ? (
          <p className="flex-1 font-dm-sans text-[12px] text-white/60">
            {showScoreSummary
              ? 'Practice complete'
              : `Question ${questionIndex + 1} of ${totalQuestions}`}
          </p>
        ) : (
          <p className="min-w-0 flex-1 truncate font-syne text-[13px] font-black text-white">
            {topicTitle}
          </p>
        )}

        <button
          onClick={onExit}
          className="flex-shrink-0 font-dm-sans text-[11px] text-white/30 active:text-white/60"
        >
          Exit
        </button>
      </div>

      {/* Progress bar — 5 segments */}
      <div className="mb-1.5 flex gap-1">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i < step ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Step labels — steps 1–3 only */}
      {!isPracticeStep && (
        <div className="flex gap-1">
          {STEP_LABELS.map((label, i) => {
            const isDone = i < step - 1;
            const isCurrent = i === step - 1;
            return (
              <span
                key={i}
                className={`flex-1 text-center font-dm-sans text-[9px] ${
                  isDone
                    ? 'text-white/50'
                    : isCurrent
                      ? 'font-bold text-white'
                      : 'text-white/30'
                }`}
              >
                {isDone ? `${label} ✓` : label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Score summary ──────────────────────────────────────────────────────────

function ScoreSummary({
  score,
  total,
  onContinue,
}: {
  score: number;
  total: number;
  onContinue: () => void;
}) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const isGood = percent >= 60;

  return (
    <div>
      <div
        className={`mb-6 rounded-xl border-2 px-4 py-8 text-center ${
          isGood ? 'border-jade bg-jade/10' : 'border-gold bg-gold/10'
        }`}
      >
        <p
          className={`font-syne text-[40px] font-black leading-none ${
            isGood ? 'text-jade' : 'text-gold'
          }`}
        >
          {score}/{total}
        </p>
        <p
          className={`mt-2 font-syne text-[16px] font-bold ${
            isGood ? 'text-jade' : 'text-gold'
          }`}
        >
          {isGood ? 'Great work!' : 'Keep practicing!'}
        </p>
        <p className="mt-1 font-dm-sans text-[13px] text-gray-500">
          {score} correct out of {total}
        </p>
      </div>
      <button
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-jade py-3.5 font-dm-sans text-[14px] font-bold text-white active:opacity-90"
      >
        Continue to AI Tutor
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Step 5 — AI Tutor scaffold ──────────────────────────────────────────────

function AITutorScaffold({
  topicTitle,
  onBack,
  onBrowse,
  onHome,
}: {
  topicTitle: string;
  onBack: () => void;
  onBrowse: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Appbar */}
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
        <button onClick={onBack} aria-label="Go back" className="flex-shrink-0 text-ink">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-jade/10">
          <Bot size={18} strokeWidth={1.5} className="text-jade" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-syne text-[14px] font-bold text-ink">AI Tutor</p>
          <p className="truncate font-dm-sans text-[11px] text-gray-400">{topicTitle}</p>
        </div>
      </header>

      {/* Coming-soon banner */}
      <div className="border-b border-jade/20 bg-jade/5 px-4 py-2.5">
        <p className="font-dm-sans text-[12px] leading-relaxed text-jade">
          AI tutor will be available once content is reviewed and approved. You can still browse
          other topics.
        </p>
      </div>

      {/* Chat area */}
      <main className="flex flex-1 flex-col px-4 pb-4 pt-4">
        {/* AI opening message bubble */}
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-jade/10">
            <Bot size={16} strokeWidth={1.5} className="text-jade" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 font-dm-sans text-[13px] leading-relaxed text-ink">
            Good work on practice. What part of{' '}
            <span className="font-bold">{topicTitle}</span> is still confusing you?
          </div>
        </div>

        {/* Navigation CTAs pushed to bottom */}
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            onClick={onBrowse}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-jade py-3.5 font-dm-sans text-[14px] font-bold text-white active:opacity-90"
          >
            Browse More Topics
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={onHome}
            className="flex w-full items-center justify-center rounded-lg border border-gray-200 py-3.5 font-dm-sans text-[14px] font-semibold text-gray-600 active:bg-gray-50"
          >
            Back to Home
          </button>
        </div>
      </main>

      {/* Disabled chat input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <input
            type="text"
            disabled
            placeholder="AI tutor coming soon..."
            className="flex-1 bg-transparent font-dm-sans text-[13px] placeholder:text-gray-300 focus:outline-none"
          />
          <MessageSquare size={18} strokeWidth={1.5} className="flex-shrink-0 text-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ── SCR-06 · Learning flow controller ──────────────────────────────────────

function LearningFlow({
  topicId,
  topicTitle,
  onExit,
}: {
  topicId: string;
  topicTitle: string;
  onExit: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<TopicDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScoreSummary, setShowScoreSummary] = useState(false);

  useEffect(() => {
    getTopicDetail(topicId)
      .then(setDetail)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load topic');
      });
  }, [topicId]);

  const advanceStep = (nextStep: 1 | 2 | 3 | 4 | 5) => {
    if (nextStep === 4) {
      setQuestionIndex(0);
      setScore(0);
      setShowScoreSummary(false);
    }
    setStep(nextStep);
  };

  const handleBack = () => {
    if (step === 5) {
      setStep(4);
      setShowScoreSummary(true);
      return;
    }
    if (showScoreSummary) {
      setShowScoreSummary(false);
      setQuestionIndex(0);
      setScore(0);
      setStep(3);
      return;
    }
    if (step === 4) {
      setQuestionIndex(0);
      setScore(0);
      setStep(3);
      return;
    }
    if (step === 1) {
      onExit();
      return;
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleQuestionComplete = (correct: boolean) => {
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);
    const total = detail?.practice_questions.length ?? 0;
    if (questionIndex < total - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setShowScoreSummary(true);
    }
  };

  if (!detail && !fetchError) return <LearningFlowSkeleton />;

  if (fetchError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6">
        <BookOpen size={36} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-center font-dm-sans text-[13px] text-gray-400">{fetchError}</p>
        <button onClick={onExit} className="font-dm-sans text-[13px] font-bold text-jade">
          Go back
        </button>
      </div>
    );
  }

  const questions = detail!.practice_questions;
  const totalQuestions = questions.length;

  // Step 5 — completely different layout
  if (step === 5) {
    return (
      <AITutorScaffold
        topicTitle={topicTitle}
        onBack={handleBack}
        onBrowse={() => router.push('/student/learn')}
        onHome={() => router.push('/student')}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LearningTopBar
        step={step}
        showScoreSummary={showScoreSummary}
        topicTitle={topicTitle}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        onBack={handleBack}
        onExit={onExit}
      />

      <main className="flex-1 overflow-y-auto bg-cream px-4 py-5">
        {/* Steps 1–3 — content card + CTA */}
        {(step === 1 || step === 2 || step === 3) && (
          <>
            <LearningStep
              step={step}
              title={getStepContent(detail!, step).title}
              content={getStepContent(detail!, step).content}
            />
            <div className="mt-5">
              <button
                onClick={() => advanceStep((step + 1) as 1 | 2 | 3 | 4 | 5)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-jade py-3.5 font-dm-sans text-[14px] font-bold text-white active:opacity-90"
              >
                {STEP_CTA[step]}
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}

        {/* Step 4 — practice questions */}
        {step === 4 && !showScoreSummary && (
          totalQuestions > 0 ? (
            <PracticeQuestion
              key={questionIndex}
              question={questions[questionIndex]}
              onComplete={handleQuestionComplete}
              isLast={questionIndex === totalQuestions - 1}
            />
          ) : (
            <div className="text-center py-8 font-dm-sans text-sm text-gray-500">
              No practice questions available for this topic.
            </div>
          )
        )}

        {/* Step 4 — score summary before AI tutor */}
        {step === 4 && showScoreSummary && (
          <ScoreSummary
            score={score}
            total={totalQuestions}
            onContinue={() => advanceStep(5)}
          />
        )}
      </main>
    </div>
  );
}

// ── Inner page — reads searchParams, decides which view to render ──────────
// Must be a separate component so Suspense can wrap it (Next.js 15 requirement
// for useSearchParams in the App Router).

function BrowseDetailInner({ topicId }: { topicId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const view = searchParams.get('view');           // 'chapters' | 'topics' | null
  const chapterId = searchParams.get('chapterId'); // present when view=topics
  const name = searchParams.get('name') ?? '';     // display name injected by caller
  const topicTitle = searchParams.get('title') ?? name;
  const subjectName = searchParams.get('subject') ?? name;

  const isChaptersView = view === 'chapters';
  const isTopicsView = view === 'topics' && !!chapterId;
  const isDetailView = !view; // no view param → learning flow

  // No view param → render the full-screen 5-step learning flow
  if (isDetailView) {
    return (
      <LearningFlow
        topicId={topicId}
        topicTitle={topicTitle || 'Topic'}
        onExit={() => router.back()}
      />
    );
  }

  // view=chapters or view=topics → browse layout with shared appbar
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex-shrink-0 text-ink"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-syne text-[17px] font-bold text-ink">
          {name}
        </h1>
      </header>

      <main className="flex flex-1 flex-col pb-20">
        {isChaptersView && (
          <ChaptersView subjectId={topicId} subjectName={subjectName} />
        )}
        {isTopicsView && (
          <TopicsView chapterId={chapterId!} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// ── Page — wraps inner component in Suspense as required by Next.js 15 ─────

export default function BrowseDetailPage() {
  const params = useParams<{ topicId: string }>();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <BrowseDetailInner topicId={params.topicId} />
    </Suspense>
  );
}
