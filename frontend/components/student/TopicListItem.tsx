'use client';

import Link from 'next/link';
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
  href?: string;
  onClick?: () => void;
}

export function TopicListItem({ topic, href, onClick }: TopicListItemProps) {
  const studied = topic.mastery_percent !== null;

  const subtitle = studied
    ? `Mastery: ${topic.mastery_percent}%${
        topic.last_studied_at
          ? ` · Last studied ${formatLastStudied(topic.last_studied_at)}`
          : ''
      }`
    : 'Not yet studied';

  const inner = (
    <div className="flex w-full items-center gap-3 border-b border-border bg-card px-4 py-3.5 text-left transition-colors active:bg-bg-2">
      {/* Title + subtitle */}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">
          {topic.title}
        </span>
        <span className="mt-0.5 block text-[13px] font-medium text-muted">
          {subtitle}
        </span>
      </span>

      {/* Action badge — sleek executive monochrome to prevent visual color clutter */}
      {studied ? (
        <span className="flex-shrink-0 rounded-[7px] border border-border-2 bg-bg-1 px-2.5 py-1 text-[12px] font-bold text-ink">
          Review →
        </span>
      ) : (
        <span className="flex-shrink-0 rounded-[7px] bg-ink px-3 py-1 text-[12px] font-bold text-white shadow-xs">
          Start →
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch className="block">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full">
      {inner}
    </button>
  );
}
