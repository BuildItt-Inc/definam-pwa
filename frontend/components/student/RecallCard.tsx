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
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#6B7280]">
              Daily Recall
            </span>
          </div>
          <span className="rounded-full bg-[#111827] px-2.5 py-0.5 text-[12px] font-semibold text-white">
            {queue.length} {queue.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>

        {/* Topics */}
        <p className="mb-1 text-[15px] font-bold text-[#111827] leading-snug">
          Time to review
        </p>
        <p className="mb-4 line-clamp-2 text-[13px] text-[#9CA3AF] leading-relaxed">
          {topicNames}
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] py-3 text-[15px] font-semibold text-white hover:bg-[#15803D] active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(22,163,74,0.2)]"
        >
          Start review
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-4 py-6 text-center">
      <BookOpen size={22} strokeWidth={1.5} className="mb-2.5 text-[#D1D5DB]" />
      <p className="mb-1 text-[15px] font-semibold text-[#111827]">
        No reviews today
      </p>
      <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
        Study a topic and it will come back for review when you need it.
      </p>
    </div>
  );
}
