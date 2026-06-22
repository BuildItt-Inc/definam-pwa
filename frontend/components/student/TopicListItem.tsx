'use client';

import type { Topic } from '@/types/topics';

// ── Last-studied formatter ─────────────────────────────────────────────────

function formatLastStudied(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ── Component ──────────────────────────────────────────────────────────────

interface TopicListItemProps {
  topic: Topic;
  onClick: () => void;
}

export function TopicListItem({ topic, onClick }: TopicListItemProps) {
  const studied = topic.mastery_percent !== null;

  const subtitle = studied
    ? `Mastery: ${topic.mastery_percent}%${
        topic.last_studied_at
          ? ` · Last studied ${formatLastStudied(topic.last_studied_at)}`
          : ''
      }`
    : 'Not yet studied';

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors active:bg-gray-50"
    >
      {/* Title + subtitle */}
      <span className="min-w-0 flex-1">
        <span className="block font-dm-sans text-[13px] font-bold text-ink">
          {topic.title}
        </span>
        <span className="mt-0.5 block font-dm-sans text-[11px] text-gray-400">
          {subtitle}
        </span>
      </span>

      {/* Action badge — wireframe: studied = jade "Study →", not yet = grey "Start →" */}
      {studied ? (
        <span className="flex-shrink-0 rounded-[3px] bg-jade px-2 py-0.5 font-dm-sans text-[10px] font-bold text-white">
          Study →
        </span>
      ) : (
        <span className="flex-shrink-0 rounded-[3px] bg-gray-500 px-2 py-0.5 font-dm-sans text-[10px] font-bold text-white">
          Start →
        </span>
      )}
    </button>
  );
}
