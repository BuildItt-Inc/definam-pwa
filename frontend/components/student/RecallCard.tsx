'use client';

import { BookOpen, ChevronRight } from 'lucide-react';
import type { RecallQueueItem } from '@/types/topics';

interface RecallCardProps {
  queue: RecallQueueItem[];
  onStart: () => void;
}

export function RecallCard({ queue, onStart }: RecallCardProps) {
  /* ── SCR-04a: Queue present ─────────────────────────────────────────── */
  if (queue.length > 0) {
    const topicNames = queue.map((item) => item.topic_title).join(' · ');

    return (
      <div className="relative z-10 rounded-xl border-[1.5px] border-ink bg-card p-3 shadow-sm">
        {/* Label row */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-ink" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-ink">
            Daily Recall
          </span>
          <span className="ml-auto flex-shrink-0 rounded-[3px] bg-ink px-1.5 py-0.5 text-[12px] font-bold text-white">
            {queue.length} due
          </span>
        </div>

        {/* Title */}
        <p className="mb-0.5 font-bold text-[17px] font-black leading-tight text-ink">
          Time to Review
        </p>

        {/* Topic names — two-line max then ellipsis */}
        <p className="mb-3 line-clamp-2 text-[13px] leading-snug text-muted">
          {topicNames}
        </p>

        {/* CTA button */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[16px] font-bold text-white hover:bg-brand-dark shadow-brand-sm transition-all active:scale-[0.98]"
        >
          Start Recall Session
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  /* ── SCR-04b: Empty state ───────────────────────────────────────────── */
  return (
    <div className="relative z-10 flex flex-col items-center rounded-xl border-[1.5px] border-dashed border-border-2 bg-bg-0 px-4 py-6 text-center">
      <BookOpen size={22} strokeWidth={1.5} className="mb-2.5 text-gray-300" />
      <p className="mb-1 font-bold text-[16px] font-bold text-ink">
        Nothing to recall yet
      </p>
      <p className="text-[14px] leading-relaxed text-muted">
        Study a topic first — it&apos;ll show up here when it&apos;s time to review.
      </p>
    </div>
  );
}
