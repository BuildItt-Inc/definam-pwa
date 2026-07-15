'use client';

import {
  Calculator,
  FlaskConical,
  FileText,
  Zap,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Subject } from '@/types/topics';

// ── Subject → icon ─────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  Chemistry: FlaskConical,
  'English Language': FileText,
  Physics: Zap,
  Economics: TrendingUp,
};

// ── Mastery badge ──────────────────────────────────────────────────────────

function MasteryBadge({ mastery }: { mastery: number | null }) {
  if (mastery === null || mastery === 0) {
    return (
      <span className="flex-shrink-0 rounded-[4px] border border-border-2 bg-bg-1 px-2 py-0.5 text-[12px] font-bold text-muted">
        —
      </span>
    );
  }
  if (mastery >= 60) {
    return (
      <span className="flex-shrink-0 rounded-[4px] bg-brand px-2 py-0.5 text-[12px] font-bold text-white shadow-brand-sm">
        {mastery}%
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-[4px] bg-ink px-2 py-0.5 text-[12px] font-bold text-white">
      {mastery}%
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const Icon = SUBJECT_ICONS[subject.name] ?? BookOpen;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-1"
    >
      {/* Subject icon box */}
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand/5 border border-brand/10 text-brand">
        <Icon size={16} strokeWidth={2} />
      </span>

      {/* Name + count */}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-ink">
          {subject.name}
        </span>
        <span className="mt-0.5 block text-[13px] font-medium text-muted">
          {subject.chapter_count} chapters · {subject.topic_count} topics
        </span>
      </span>

      <MasteryBadge mastery={subject.mastery_percent} />

      <ChevronRight size={16} strokeWidth={2} className="flex-shrink-0 text-faint" />
    </button>
  );
}
