'use client';

import { Flag } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';

interface LearningStepProps {
  step: 1 | 2 | 3;
  title: string;
  content: string;
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  return (
    <div className="mb-6">
      {/* ── Step header ───────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-jade font-syne text-[11px] font-black text-white">
          {step}
        </span>
        <span className="font-syne text-[15px] font-bold text-ink">{title}</span>
        {step === 2 && (
          <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-[3px] bg-jade px-1.5 py-0.5 font-dm-sans text-[9px] font-bold text-white">
            <Flag size={9} strokeWidth={2} />
            Local
          </span>
        )}
      </div>

      {/* ── Step 1 — Simple Definition (white card) ───────────────────── */}
      {step === 1 && (
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <MathContent
            content={content}
            className="font-dm-sans text-[14px] text-ink"
          />
        </div>
      )}

      {/* ── Step 2 — Nigerian Example (jade accent card) ──────────────── */}
      {step === 2 && (
        <div className="rounded-xl border-l-4 border-jade bg-jade/8 px-5 py-4">
          <MathContent
            content={content}
            className="font-dm-sans text-[14px] text-ink"
          />
        </div>
      )}

      {/* ── Step 3 — Visual Breakdown (structured cheat-sheet) ────────── */}
      {step === 3 && (
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          {/* Render line-by-line so tree symbols and math both display right */}
          {content.split('\n').map((line, i) => (
            <div key={i} className={`${i > 0 ? 'mt-2' : ''}`}>
              {line.trim() === '' ? (
                <div className="h-2" />
              ) : (
                <MathContent
                  content={line}
                  allowBlock={false}
                  className="font-mono text-[12.5px] leading-snug text-ink"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
