'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Subject } from '@/types/topics';
import { subjectIcon } from '@/lib/utils/subjects';

interface SubjectCardProps {
  subject: Subject;
  href?: string;
  onClick?: () => void;
}

export function SubjectCard({ subject, href, onClick }: SubjectCardProps) {
  const Icon = subjectIcon(subject.name);
  const mastery = subject.mastery_percent;

  const inner = (
    <div className="flex w-full items-center gap-3 border-b border-border bg-card px-4 py-4 text-left transition-colors active:bg-bg-2">
      {/* Icon */}
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-dim border border-brand/20">
        <Icon size={16} strokeWidth={1.8} className="text-brand" />
      </span>

      {/* Name and meta */}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">
          {subject.name}
        </span>
        <span className="mt-0.5 block text-[13px] text-muted">
          {subject.chapter_count} chapters
        </span>
      </span>

      {/* Mastery */}
      {mastery !== null && mastery > 0 ? (
        <span
          className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${
            mastery >= 60
              ? 'bg-brand-dim text-brand'
              : 'bg-bg-2 text-ink-2'
          }`}
        >
          {mastery}%
        </span>
      ) : (
        <span className="flex-shrink-0 rounded-md bg-bg-2 px-2 py-0.5 text-[12px] font-medium text-faint">
          New
        </span>
      )}

      <ChevronRight size={15} strokeWidth={1.5} className="flex-shrink-0 text-faint ml-1" />
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
