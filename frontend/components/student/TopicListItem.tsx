'use client';

import type { Topic } from '@/types/topics';

// ── Last-studied formatter ─────────────────────────────────────────────────

function formatLastStudied(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
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
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-1"
    >
      {/* Title + subtitle */}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-ink">
          {topic.title}
        </span>
        <span className="mt-0.5 block text-[13px] font-medium text-muted">
          {subtitle}
        </span>
      </span>

      {/* Action badge */}
      {studied ? (
        <span className="flex-shrink-0 rounded-[4px] bg-brand px-2 py-0.5 text-[12px] font-bold text-white shadow-brand-sm">
          Study →
        </span>
      ) : (
        <span className="flex-shrink-0 rounded-md bg-brand px-3 py-1 text-[12px] font-bold text-white shadow-sm hover:bg-brand-dark transition-colors">
          Start →
        </span>
      )}
    </button>
  );
}
