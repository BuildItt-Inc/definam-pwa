'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight, BookOpen, Check, ArrowDown, ArrowUp, X, Bot } from 'lucide-react';
import {
  getChaptersBySubjectName,
  getCachedChaptersBySubjectName,
  getTopics,
  getCachedTopics,
  getTopicDetail,
  getCachedTopicDetail,
  pingTopicActivity,
  submitTopicCompletion,
} from '@/lib/api/topics';
import Link from 'next/link';
import type { Chapter, Topic, TopicDetail } from '@/types/topics';
import { TopicListItem } from '@/components/student/TopicListItem';
import { AnalyticsEvents } from '@/lib/analytics';
import { LearningStep } from '@/components/student/LearningStep';
import { PracticeQuestion } from '@/components/student/PracticeQuestion';
import { ChatMessageItem } from '@/components/student/ChatMessageItem';
import { useSmartChatScroll } from '@/hooks/useSmoothedStream';
import { getFollowUpSuggestions } from '@/lib/utils/chatFollowUps';
import {
  getChatHistory,
  getCachedChatHistory,
  setCachedChatHistory,
  sendChatMessageStream,
  type ChatMessage,
} from '@/lib/api/chat';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { useFloatingChat } from '@/components/student/FloatingChat/FloatingChatContext';
import { AskZikoraButton } from '@/components/student/FloatingChat/FloatingChatWidget';
import { stepSlide } from '@/lib/motion';
import { toast } from '@/lib/toast';
import { getStudentProfile } from '@/lib/utils/studentProfile';

// Dark, spotlight-hover CTA matching the redesigned learning interface's
// .cta-btn — same underlying pattern as the landing page's buttons/cards.
function StepCta({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary w-full min-h-[48px]"
    >
      <span className="flex items-center gap-2">{children}</span>
    </button>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function MasteryBadge({ mastery }: { mastery: number | null }) {
  if (mastery === null || mastery === 0) {
    return (
      <span className="flex-shrink-0 rounded-md border border-border bg-bg-0 px-2 py-0.5 text-[12px] font-semibold text-muted">
        —
      </span>
    );
  }
  if (mastery >= 60) {
    return (
      <span className="flex-shrink-0 rounded-md bg-brand-tint px-2 py-0.5 text-[12px] font-bold text-brand">
        {mastery}%
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-md bg-warn-bg px-2 py-0.5 text-[12px] font-bold text-warn">
      {mastery}%
    </span>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 animate-pulse rounded bg-bg-3" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-5 w-8 animate-pulse rounded-[3px] bg-bg-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <BookOpen size={32} strokeWidth={1.5} className="mb-3 text-gray-300" />
      <p className="text-[15px] text-muted">{message}</p>
    </div>
  );
}

// ── Suspense fallback — used while searchParams resolve ────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-card">
      <div className="border-b border-border px-4 py-3.5">
        <div className="h-5 w-24 animate-pulse rounded bg-bg-3" />
      </div>
      <ListSkeleton />
    </div>
  );
}

// ── SCR-05b · Chapters view ────────────────────────────────────────────────

// Fixed display order — chapters come back grouped by class_level from the
// backend already, but we render explicit section headers per level rather
// than flattening, so e.g. each level's own "Chapter 1" reads clearly as
// belonging to that level, not as a duplicate of another level's chapter.
const CLASS_LEVEL_ORDER = ['SS1', 'SS2', 'SS3'];

function ChaptersView({ subjectName }: { subjectName: string }) {
  const [chapters, setChapters] = useState<Chapter[] | null>(() =>
    getCachedChaptersBySubjectName(subjectName),
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const cached = getCachedChaptersBySubjectName(subjectName);
    if (cached && cached.length > 0) {
      setChapters(cached);
    } else {
      setChapters(null);
    }
    setFetchError(null);
    getChaptersBySubjectName(subjectName)
      .then(setChapters)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [subjectName, retryTick]);

  if (fetchError && !chapters) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <p className="text-sm text-muted">{fetchError}</p>
        <button
          type="button"
          onClick={() => setRetryTick((n) => n + 1)}
          className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!chapters) return <ListSkeleton />;
  if (chapters.length === 0) return <EmptyState message="No chapters found for this subject." />;

  const totalTopics = chapters.reduce((sum, ch) => sum + ch.topic_count, 0);
  const levels = CLASS_LEVEL_ORDER.filter((level) =>
    chapters.some((ch) => ch.class_level === level),
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-4">
      <p className="text-[13px] font-medium text-muted">
        {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} · {totalTopics} {totalTopics === 1 ? 'topic' : 'topics'}
      </p>
      {levels.map((level) => {
        const levelChapters = chapters.filter((ch) => ch.class_level === level);
        return (
          <div key={level}>
            <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-muted">
              {level} · {levelChapters.length} {levelChapters.length === 1 ? 'chapter' : 'chapters'}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {levelChapters.map((chapter) => {
                const mastery = chapter.mastery_percent ?? 0;
                const inProgress = chapter.mastery_percent !== null && chapter.mastery_percent > 0;
                return (
                  <Link
                    key={chapter.id}
                    href={`/student/learn/${chapter.id}?view=topics&chapterId=${chapter.id}&name=${encodeURIComponent(
                      chapter.title,
                    )}&subject=${encodeURIComponent(subjectName)}`}
                    prefetch
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-ink">
                        {chapter.title}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted">
                        {chapter.topic_count} {chapter.topic_count === 1 ? 'topic' : 'topics'}
                        {inProgress ? ' · In progress' : ''}
                      </span>
                      {inProgress && (
                        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-bg-2">
                          <span
                            className="block h-full rounded-full bg-brand"
                            style={{ width: `${mastery}%` }}
                          />
                        </span>
                      )}
                    </span>
                    <MasteryBadge mastery={chapter.mastery_percent} />
                    <ChevronRight size={16} strokeWidth={1.8} className="flex-shrink-0 text-faint" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SCR-05c · Topics view ──────────────────────────────────────────────────

function TopicsView({
  chapterId,
  chapterTitle,
  subjectName,
}: {
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
}) {
  const [topics, setTopics] = useState<Topic[] | null>(() => getCachedTopics(chapterId));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const cached = getCachedTopics(chapterId);
    if (cached && cached.length > 0) {
      setTopics(cached);
    } else {
      setTopics(null);
    }
    setFetchError(null);
    getTopics(chapterId)
      .then(setTopics)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load topics');
      });
  }, [chapterId, retryTick]);

  if (fetchError && !topics) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
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

  if (!topics) return <ListSkeleton />;
  if (topics.length === 0) return <EmptyState message="No topics found in this chapter." />;

  const completedCount = topics.filter((t) => t.mastery_percent !== null && t.mastery_percent > 0).length;
  const progressPercent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const firstUnstartedIdx = topics.findIndex((t) => t.mastery_percent === null || t.mastery_percent === 0);
  const nextTopic = firstUnstartedIdx >= 0 ? topics[firstUnstartedIdx] : topics[0];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5">
      {/* Chapter header + progress */}
      <div className="mb-5">
        <h2 className="text-[22px] font-bold leading-tight tracking-tight text-ink">
          {chapterTitle}
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">Progress</span>
            <span className="text-muted">
              {completedCount} of {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-2">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Unified topic list card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
        {topics.map((topic, index) => (
          <TopicListItem
            key={topic.id}
            topic={topic}
            index={index}
            isNext={index === firstUnstartedIdx}
            href={`/student/learn/${topic.id}?title=${encodeURIComponent(topic.title)}&subject=${encodeURIComponent(subjectName)}`}
          />
        ))}
      </div>

      {/* Sticky bottom primary CTA */}
      {nextTopic && (
        <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom,0px))] mt-6 pt-2">
          <Link
            href={`/student/learn/${nextTopic.id}?title=${encodeURIComponent(nextTopic.title)}&subject=${encodeURIComponent(subjectName)}`}
            prefetch
            className="btn-primary w-full shadow-md"
          >
            <span>
              {completedCount === 0
                ? 'Start first topic'
                : firstUnstartedIdx >= 0
                  ? 'Continue next topic'
                  : 'Review first topic'}
            </span>
            <ArrowRight size={17} strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Learning flow ──────────────────────────────────────────────────────────

const STEP_LABELS = ['Explain', 'Example', 'Practice', 'Chat'] as const;

const STEP_CTA: Record<1 | 2, string> = {
  1: 'Continue to example',
  2: 'Continue to practice',
};

function getStepContent(detail: TopicDetail, step: 1 | 2 ) {
  return step === 1 ? detail.step1 : detail.step2;
}

// ── Learning flow skeleton ──────────────────────────────────────────────────

function LearningFlowSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-0">
      <div className="border-b border-border bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-8 w-24 animate-pulse rounded-lg bg-bg-2" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-bg-2" />
          </div>
          <div className="mb-1.5 flex gap-1.5">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-brand' : 'bg-bg-3'}`}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className={`flex-1 text-center text-[10.5px] ${i === 0 ? 'font-bold text-brand' : 'text-muted'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
        <div className="mb-2 h-3 w-28 animate-pulse rounded bg-bg-2" />
        <div className="mb-5 h-7 w-48 animate-pulse rounded bg-bg-3" />
        <div className="mb-4 rounded-xl border border-border bg-card px-5 py-5">
          <div className="space-y-3">
            <div className="h-3.5 w-full animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-full animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-[80%] animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-[90%] animate-pulse rounded bg-bg-2" />
            <div className="h-3.5 w-[60%] animate-pulse rounded bg-bg-2" />
          </div>
        </div>
        <div className="h-12 animate-pulse rounded-lg bg-bg-3" />
      </div>
    </div>
  );
}

// ── Top bar for steps 1–4 ──────────────────────────────────────────────────

function LearningTopBar({
  step,
  topicId,
  onBack,
  onExit,
}: {
  step: 1 | 2 | 3 | 4;
  topicId: string;
  onBack: () => void;
  onExit: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="mx-auto max-w-2xl">
        {/* Navigation row: Exit/Back on left, Ask Zikora on right */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Previous step"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-ink hover:bg-bg-2 active:scale-95 transition-all"
              >
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13.5px] font-semibold text-ink hover:bg-bg-2 active:scale-[0.97] transition-all"
            >
              <X size={16} strokeWidth={2} className="text-muted" />
              <span>Exit lesson</span>
            </button>
          </div>

          <AskZikoraButton topicId={topicId} />
        </div>

        {/* Progress bar — 4 segments */}
        <div className="mb-1.5 flex gap-1.5">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand' : 'bg-bg-3'}`}
            />
          ))}
        </div>

        {/* Step labels */}
        <div className="flex gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const isDone = i < step - 1;
            const isCurrent = i === step - 1;
            return (
              <span
                key={i}
                className={`flex flex-1 items-center justify-center gap-1 text-center text-[10.5px] ${
                  isDone || isCurrent ? 'font-bold text-brand' : 'font-medium text-muted'
                }`}
              >
                {isDone && <Check size={10} strokeWidth={3} />}
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </header>
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
        className={`mb-6 rounded-xl border px-4 py-8 text-center ${
          isGood ? 'border-brand/30 bg-brand-tint' : 'border-warn/30 bg-warn-bg'
        }`}
      >
        <p className={`text-[40px] font-bold leading-none ${isGood ? 'text-brand' : 'text-warn'}`}>
          {score}/{total}
        </p>
        <p className="mt-2 text-[16px] font-bold text-ink">
          {isGood ? 'Great work!' : 'Needs another look'}
        </p>
        <p className="mt-1 text-[14.5px] text-ink-2">
          {score} correct out of {total}
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="btn-primary w-full"
      >
        <span>Continue to Zikora</span>
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Step 5 — AI Tutor (Streaming Chat) ──────────────────────────────────────

function AITutorScaffold({
  topicId,
  topicTitle,
  onBack,
  onBrowse,
  onHome,
}: {
  topicId: string;
  topicTitle: string;
  onBack: () => void;
  onBrowse: () => void;
  onHome: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = getCachedChatHistory(topicId);
    if (cached && cached.length > 0) return cached;
    const profile = getStudentProfile();
    const studentName = profile?.name?.trim() ? ` ${profile.name.trim()}` : ' there';
    return [
      {
        role: 'assistant',
        content: `Hi${studentName}. Ask me anything about this topic, or tell me the part you're stuck on.`,
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    scrollContainerRef,
    messagesEndRef,
    showJumpToBottom,
    handleScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    jumpToBottom,
    pinToBottom,
    followIfPinned,
  } = useSmartChatScroll();
  const { setSuppressed } = useFloatingChat();

  // Suppress floating AI widget while at the full-screen AI chat page
  useEffect(() => {
    setSuppressed(true);
    return () => {
      setSuppressed(false);
    };
  }, [setSuppressed]);

  // Load chat history in background on mount
  useEffect(() => {
    let isCurrent = true;
    getChatHistory(topicId)
      .then((history) => {
        if (!isCurrent) return;
        if (history && history.length > 0) {
          setMessages(history);
          setCachedChatHistory(topicId, history);
        }
      })
      .catch(() => {
        // Fallback welcoming message already displayed
      });

    return () => {
      isCurrent = false;
    };
  }, [topicId, topicTitle]);

  useEffect(() => {
    followIfPinned();
  }, [messages.length, followIfPinned]);

  const submitMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    // Append user message + placeholder assistant bubble atomically
    setMessages((prev) => {
      const next: ChatMessage[] = [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: '' },
      ];
      setCachedChatHistory(topicId, next);
      return next;
    });

    pinToBottom();

    let responseAccumulator = '';

    try {
      await sendChatMessageStream(
        topicId,
        query,
        (chunk) => {
          responseAccumulator += chunk;
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (next[lastIdx]?.role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content: responseAccumulator,
              };
            }
            setCachedChatHistory(topicId, next);
            return next;
          });
        },
        () => {
          setIsLoading(false);
        },
        (err) => {
          setIsLoading(false);
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (next[lastIdx]?.role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content:
                  responseAccumulator || (err?.message || "Sorry, I couldn't reach the AI tutor. Please try again."),
              };
            }
            setCachedChatHistory(topicId, next);
            return next;
          });
        }
      );
    } catch {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitMessage(inputMessage);
  };

  const followUpSuggestions = !isLoading ? getFollowUpSuggestions(messages, topicTitle) : [];

  return (
    <div className="flex h-[100dvh] flex-col bg-bg-0 relative overflow-hidden">
      {/* Appbar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <button onClick={onBack} aria-label="Go back" className="flex-shrink-0 text-ink/70 hover:text-ink -ml-1 p-1">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
          <Bot size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px] text-ink leading-tight">Zikora</p>
          <p className="text-[12px] text-muted">Your AI study tutor</p>
        </div>
      </header>

      {/* Context banner */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[12.5px] font-medium text-ink-2">
          <BookOpen size={14} className="text-brand flex-shrink-0" />
          <span className="truncate">Helping with: <strong className="font-semibold text-ink">{topicTitle}</strong></span>
        </div>
      </div>

      {/* Chat area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-y-auto pb-8 pt-4"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
          {messages.map((msg, index) => {
            const isLast = index === messages.length - 1;
            const isStreamingThis = isLast && isLoading && msg.role === 'assistant';

            return (
              <div key={index} className="space-y-3">
                <ChatMessageItem
                  message={msg}
                  isStreaming={isStreamingThis}
                  onStreamAdvance={followIfPinned}
                />

                {/* Auto follow-up question pills directly beneath assistant reply */}
                {isLast && msg.role === 'assistant' && !isLoading && followUpSuggestions.length > 0 && (
                  <div className="flex flex-wrap items-start gap-2 pt-1">
                    {followUpSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void submitMessage(suggestion)}
                        className="rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-ink shadow-2xs hover:bg-bg-2 active:scale-[0.98] transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Centered circular jump-to-bottom button */}
      {showJumpToBottom && (
        <button
          type="button"
          onClick={jumpToBottom}
          aria-label="Jump to bottom"
          className={`absolute ${!isLoading && messages.length > 2 ? 'bottom-[134px]' : 'bottom-[82px]'} left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-ink shadow-md transition-all hover:bg-bg-2 active:scale-95`}
        >
          <ArrowDown size={16} strokeWidth={2.2} />
        </button>
      )}

      {/* Bottom control CTAs if inactive */}
      {!isLoading && messages.length > 2 && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-2.5">
          <div className="mx-auto flex max-w-3xl gap-2 justify-center">
            <button
              onClick={onBrowse}
              className="flex-1 rounded-xl bg-ink text-white py-2.5 text-xs font-bold hover:bg-ink/90 active:scale-95 transition-all"
            >
              Browse Topics
            </button>
            <button
              onClick={onHome}
              className="flex-1 rounded-xl border border-border bg-card text-ink py-2.5 text-xs font-bold hover:bg-bg-2 active:scale-95 transition-all"
            >
              Back Home
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] bg-card w-full max-w-full box-border shrink-0"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-border-2 bg-bg-0 px-3 py-2 focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/5 transition-all w-full box-border">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Zikora"
            className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[14px] leading-normal placeholder:text-faint focus:outline-none text-ink disabled:opacity-50 touch-manipulation"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-white hover:bg-[#1f3029] disabled:bg-bg-2 disabled:text-faint transition-all active:scale-95"
            aria-label="Send message"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ── SCR-06 · Learning flow controller ──────────────────────────────────────

function LearningFlow({
  topicId,
  topicTitle,
  subjectName,
  onExit,
}: {
  topicId: string;
  topicTitle: string;
  subjectName?: string;
  onExit: () => void;
}) {
  const router = useRouter();
  const { celebrate } = useCelebration();
  const { setSuppressed } = useFloatingChat();
  const [detail, setDetail] = useState<TopicDetail | null>(() => getCachedTopicDetail(topicId));
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScoreSummary, setShowScoreSummary] = useState(false);
  // +1 advancing (Continue/Next), -1 going back — drives which direction the
  // slide+fade transition animates in (see stepSlide in lib/motion.ts).
  const [direction, setDirection] = useState(1);

  // Use header Ask Zikora button inside active lesson instead of the floating circle
  useEffect(() => {
    setSuppressed(true);
    return () => setSuppressed(false);
  }, [setSuppressed]);

  useEffect(() => {
    setFetchError(null);
    getTopicDetail(topicId)
      .then((data) => {
        setDetail(data);
        AnalyticsEvents.topicOpened({ topic_id: topicId, title: topicTitle });
        // Engagement signal for the streak — fires once per topic open,
        // independent of whether the student finishes it. The response
        // itself is the trigger for the streak celebration — this is the
        // one call that can actually know "today just became a new streak
        // day," rather than the frontend polling the dashboard and guessing.
        pingTopicActivity(topicId).then((result) => {
          if (result?.streak_incremented_today) {
            celebrate({ type: 'streak', days: result.streak_days });
          }
        });
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load topic');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, retryTick]);

  const advanceStep = (nextStep: 1 | 2 | 3 | 4) => {
    setDirection(1);
    if (nextStep === 3) { // was: nextStep === 4 — practice is now 3
      setQuestionIndex(0);
      setScore(0);
      setShowScoreSummary(false);
    }
    setStep(nextStep);
  };

  const handleBack = () => {
    setDirection(-1);
    if (step === 4) { // was: step === 5 (chat)
      setStep(3); // was: setStep(4) — back to practice
      setShowScoreSummary(true);
      return;
    }
    if (showScoreSummary) {
      setShowScoreSummary(false);
      setQuestionIndex(0);
      setScore(0);
      setStep(2); // was: setStep(3) — back to Example, since Visual (old step 3) is gone
      return;
    }
    if (step === 3) { // was: step === 4 (practice)
      setQuestionIndex(0);
      setScore(0);
      setStep(2); // was: setStep(3) — back to Example
      return;
    }
    if (step === 1) {
      onExit();
      return;
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleQuestionComplete = (correct: boolean) => {
    setDirection(1);
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);
    const total = detail?.practice_questions.length ?? 0;
    if (questionIndex < total - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      // Finished practice — this is what makes the topic eligible for the
      // recall queue (creates its first TopicReview row server-side).
      AnalyticsEvents.practiceFinished({ topic_id: topicId, score: nextScore, total, passed: total > 0 && nextScore / total >= 0.5 });
      submitTopicCompletion(topicId, Math.round((nextScore / total) * 100)).then((ok) => {
        if (ok) {
          toast.success('Topic completed', `${nextScore}/${total} correct`);
        }
      });
      setShowScoreSummary(true);
    }
  };

  if (!detail && !fetchError) return <LearningFlowSkeleton />;

  if (fetchError && !detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-card px-6">
        <BookOpen size={36} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-center text-[15px] text-muted">{fetchError}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRetryTick((n) => n + 1)}
            className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-ink active:scale-95 transition-all"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const questions = detail!.practice_questions;
  const totalQuestions = questions.length;

  // Step 5 — completely different layout
  if (step === 4) {
    return (
      <AITutorScaffold
        topicId={topicId}
        topicTitle={topicTitle}
        onBack={handleBack}
        onBrowse={() => router.push('/student/learn')}
        onHome={() => router.push('/student')}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-0">
      <LearningTopBar
        step={step}
        topicId={topicId}
        onBack={handleBack}
        onExit={onExit}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 py-5 pb-8">
        {/* Topic eyebrow + title matching clean lesson header */}
        <div className="mb-4">
          <p className="text-[12.5px] font-medium text-muted">
            {subjectName ? `${subjectName} · ` : ''}
            {step === 3
              ? showScoreSummary
                ? 'Practice complete'
                : `Question ${questionIndex + 1} of ${totalQuestions}`
              : `Step ${step} of 4`}
          </p>
          <h1 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-ink">
            {topicTitle}
          </h1>
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${step}-${questionIndex}-${showScoreSummary}`}
            custom={direction}
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {(step === 1 || step === 2) && (
              <>
                <LearningStep
                  step={step}
                  title={getStepContent(detail!, step).title}
                  content={getStepContent(detail!, step).content}
                />
                <div className="mt-6 pb-safe">
                  <StepCta onClick={() => advanceStep((step + 1) as 1 | 2 | 3 | 4)}>
                    {STEP_CTA[step]}
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </StepCta>
                </div>
              </>
            )}

            {step === 3 && !showScoreSummary && (
              totalQuestions > 0 ? (
                <PracticeQuestion
                  question={questions[questionIndex]}
                  onComplete={handleQuestionComplete}
                  isLast={questionIndex === totalQuestions - 1}
                  topicId={topicId}
                />
              ) : (
                <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted">
                  No practice questions available for this topic.
                </div>
              )
            )}

            {step === 3 && showScoreSummary && (
              <ScoreSummary
                score={score}
                total={totalQuestions}
                onContinue={() => advanceStep(4)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Inner page — reads searchParams, decides which view to render ──────────

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

  // No view param → render the full-screen 4-step learning flow
  if (isDetailView) {
    return (
      <LearningFlow
        topicId={topicId}
        topicTitle={topicTitle || 'Topic'}
        subjectName={subjectName !== name ? subjectName : searchParams.get('subject') ?? undefined}
        onExit={() => router.back()}
      />
    );
  }

  // view=chapters or view=topics → browse layout with clean header
  return (
    <div className="flex min-h-screen flex-col bg-bg-0">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink hover:bg-bg-2 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <h1 className="min-w-0 truncate text-[17px] font-bold text-ink">
              {isTopicsView && subjectName ? subjectName : name}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-nav">
        {isChaptersView && (
          <ChaptersView subjectName={subjectName} />
        )}
        {isTopicsView && (
          <TopicsView chapterId={chapterId!} chapterTitle={name} subjectName={subjectName} />
        )}
      </main>
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
