'use client';

import { BookOpen, ArrowRight } from 'lucide-react';
import type { RecallQueueItem } from '@/types/topics';

interface RecallCardProps {
  queue: RecallQueueItem[];
  onStart: () => void;
}

export function RecallCard({ queue, onStart }: RecallCardProps) {
  if (queue.length > 0) {
    const topicNames = queue.map((item) => item.topic_title).join(', ');

    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted">
              Daily Review
            </span>
          </div>
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-[12px] font-bold text-brand">
            {queue.length} {queue.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>

        <p className="mb-1 text-[15px] font-bold text-ink leading-snug">
          Time to review
        </p>
        <p className="mb-4 line-clamp-2 text-[13.5px] text-muted leading-relaxed">
          {topicNames}
        </p>

        <button
          type="button"
          onClick={onStart}
          className="btn-primary w-full"
        >
          <span>Start review</span>
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-bg-2 text-muted">
        <BookOpen size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-bold text-ink leading-snug">
          No reviews today
        </p>
        <p className="mt-0.5 text-[13px] text-muted leading-relaxed">
          Study a topic and it will come back for review when you need it.
        </p>
      </div>
    </div>
  );
}
