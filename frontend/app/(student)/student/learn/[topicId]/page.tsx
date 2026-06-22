'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';
import { getChapters, getTopics } from '@/lib/api/topics';
import type { Chapter, Topic } from '@/types/topics';
import { TopicListItem } from '@/components/student/TopicListItem';
import { BottomNav } from '@/components/student/BottomNav';

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

// ── List skeleton ──────────────────────────────────────────────────────────

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-gray-100 px-4 py-3"
        >
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

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <BookOpen size={32} strokeWidth={1.5} className="mb-3 text-gray-300" />
      <p className="font-dm-sans text-[13px] text-gray-400">{message}</p>
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

  if (chapters.length === 0) {
    return <EmptyState message="No chapters found for this subject." />;
  }

  return (
    <>
      {/* Subtitle row */}
      <p className="px-4 py-1.5 font-dm-sans text-[11px] text-gray-400">
        SS2 Syllabus · {chapters.length} chapters
      </p>

      {/* Chapter list */}
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
                  {chapter.topic_count} topics
                  {inProgress ? ' · In Progress' : ''}
                </span>
              </span>

              <MasteryBadge mastery={chapter.mastery_percent} />

              <ChevronRight
                size={16}
                strokeWidth={1.5}
                className="flex-shrink-0 text-gray-300"
              />
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── SCR-05c · Topics view ──────────────────────────────────────────────────

function TopicsView({
  chapterId,
  chapterName,
}: {
  chapterId: string;
  chapterName: string;
}) {
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

  if (topics.length === 0) {
    return <EmptyState message="No topics found in this chapter." />;
  }

  return (
    <>
      {/* Subtitle row */}
      <p className="px-4 py-1.5 font-dm-sans text-[11px] text-gray-400">
        {topics.length} topics · WAEC-aligned
      </p>

      {/* Topic list */}
      <div>
        {topics.map((topic) => (
          <TopicListItem
            key={topic.id}
            topic={topic}
            onClick={() => router.push(`/student/learn/${topic.id}`)}
          />
        ))}
      </div>
    </>
  );
}

// ── Topic detail scaffold ──────────────────────────────────────────────────

function TopicDetailScaffold({ topicId }: { topicId: string }) {
  void topicId; // will be used in the next prompt's learning flow
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
      <p className="font-dm-sans text-[13px] text-gray-400">
        Learning flow coming in the next screen.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function BrowseDetailPage() {
  const params = useParams<{ topicId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const view = searchParams.get('view');           // 'chapters' | 'topics' | null
  const chapterId = searchParams.get('chapterId'); // present when view=topics
  const name = searchParams.get('name') ?? '';     // header title injected by navigate
  const subjectName = searchParams.get('subject') ?? name;

  const dynamicId = params.topicId; // subject ID (chapters/topics views) or topic ID (detail)

  const isChaptersView = view === 'chapters';
  const isTopicsView = view === 'topics' && !!chapterId;
  const isDetailView = !view; // no view param → individual topic detail

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* ── Appbar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex-shrink-0 text-ink"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-syne text-[17px] font-bold text-ink">
          {isDetailView ? 'Topic' : name}
        </h1>
      </header>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col pb-20">
        {isChaptersView && (
          <ChaptersView subjectId={dynamicId} subjectName={subjectName} />
        )}

        {isTopicsView && (
          <TopicsView chapterId={chapterId!} chapterName={name} />
        )}

        {isDetailView && (
          <TopicDetailScaffold topicId={dynamicId} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
