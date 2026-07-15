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

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  Chemistry: FlaskConical,
  'English Language': FileText,
  Physics: Zap,
  Economics: TrendingUp,
};

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const Icon = SUBJECT_ICONS[subject.name] ?? BookOpen;
  const mastery = subject.mastery_percent;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-[#F3F4F6] px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB] active:bg-[#F3F4F6]"
    >
      {/* Icon */}
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
        <Icon size={16} strokeWidth={1.8} className="text-[#16A34A]" />
      </span>

      {/* Name and meta */}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#111827]">
          {subject.name}
        </span>
        <span className="mt-0.5 block text-[13px] text-[#9CA3AF]">
          {subject.chapter_count} chapters
        </span>
      </span>

      {/* Mastery */}
      {mastery !== null && mastery > 0 ? (
        <span
          className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${
            mastery >= 60
              ? 'bg-[#F0FDF4] text-[#16A34A]'
              : 'bg-[#F3F4F6] text-[#6B7280]'
          }`}
        >
          {mastery}%
        </span>
      ) : (
        <span className="flex-shrink-0 rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[12px] font-medium text-[#9CA3AF]">
          New
        </span>
      )}

      <ChevronRight size={15} strokeWidth={1.5} className="flex-shrink-0 text-[#D1D5DB] ml-1" />
    </button>
  );
}
