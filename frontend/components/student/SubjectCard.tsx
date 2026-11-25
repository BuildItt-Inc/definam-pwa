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
  const mastery = subject.mastery_percent ?? 0;
  const started = subject.mastery_percent !== null && subject.mastery_percent > 0;

  const inner = (
    <div className="flex min-h-[68px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-bg-0 active:bg-bg-2">
      {/* Clean borderless subject icon */}
      <span className="flex w-9 flex-shrink-0 items-center justify-center text-ink-2">
        <Icon size={26} strokeWidth={1.6} />
      </span>

      {/* Name, dynamic meta, and progress bar */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-bold text-ink">
            {subject.name}
          </span>
          {started && (
            <span className="flex-shrink-0 text-xs font-semibold text-brand">
              {mastery}%
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-muted">
          {subject.chapter_count} {subject.chapter_count === 1 ? 'chapter' : 'chapters'}
        </span>
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-bg-2">
          <span
            className="block h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${mastery}%` }}
          />
        </span>
      </span>

      <ChevronRight size={16} strokeWidth={1.8} className="flex-shrink-0 text-faint" />
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
