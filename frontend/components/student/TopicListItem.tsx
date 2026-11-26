'use client';

import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
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
  index?: number;
  isNext?: boolean;
  href?: string;
  onClick?: () => void;
}

export function TopicListItem({
  topic,
  index,
  isNext = false,
  href,
  onClick,
}: TopicListItemProps) {
  const studied = topic.mastery_percent !== null && topic.mastery_percent > 0;
  const mastery = topic.mastery_percent ?? 0;
  const needsWork = studied && mastery < 60;

  const subtitle = studied
    ? `${needsWork ? 'Needs another look' : 'Completed'} · ${mastery}%${
        topic.last_studied_at ? ` · ${formatLastStudied(topic.last_studied_at)}` : ''
      }`
    : isNext
      ? 'Start here'
      : 'Not started';

  const inner = (
    <div
      className={`flex min-h-[62px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-bg-2 ${
        isNext ? 'bg-brand-tint/60 hover:bg-brand-tint' : 'bg-card hover:bg-bg-0'
      }`}
    >
      {/* Number / completion square badge */}
      {studied ? (
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
            needsWork ? 'bg-warn-bg text-warn' : 'bg-brand-tint text-brand'
          }`}
        >
          <Check size={16} strokeWidth={2.6} />
        </span>
      ) : (
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isNext
              ? 'bg-brand text-white shadow-2xs'
              : 'bg-bg-2 text-ink-2'
          }`}
        >
          {typeof index === 'number' ? index + 1 : '•'}
        </span>
      )}

      {/* Title + subtitle */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">
          {topic.title}
        </span>
        <span
          className={`mt-0.5 block text-[12.5px] font-medium ${
            isNext
              ? 'text-brand font-semibold'
              : needsWork
                ? 'text-warn'
                : studied
                  ? 'text-brand'
                  : 'text-muted'
          }`}
        >
          {subtitle}
        </span>
      </span>

      <ChevronRight
        size={16}
        strokeWidth={1.9}
        className={`flex-shrink-0 ${isNext ? 'text-brand' : 'text-faint'}`}
      />
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
