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
    <div>
      {/* ── Step header ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-jade font-syne text-[12px] font-black text-white shadow-sm">
          {step}
        </span>
        <span className="font-syne text-[16px] font-bold text-ink">{title}</span>
        {step === 2 && (
          <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-full bg-jade/15 px-2 py-0.5 font-dm-sans text-[9px] font-bold text-jade">
            <Flag size={9} strokeWidth={2} />
            Nigerian Context
          </span>
        )}
      </div>

      {/* ── Step 1 — Simple Definition ──────────────────────────────────── */}
      {step === 1 && (
        <div className="rounded-2xl bg-white px-5 py-5 shadow-sm">
          <MathContent
            content={content}
            className="step-body font-dm-sans text-[14.5px] leading-[1.75] text-ink"
          />
        </div>
      )}

      {/* ── Step 2 — Nigerian Example ────────────────────────────────────── */}
      {step === 2 && (
        <div className="rounded-2xl border-l-[3px] border-jade bg-jade/5 px-5 py-5">
          <MathContent
            content={content}
            className="step-body font-dm-sans text-[14.5px] leading-[1.75] text-ink"
          />
        </div>
      )}

      {/* ── Step 3 — Visual Breakdown ────────────────────────────────────── */}
      {step === 3 && (
        <div className="rounded-2xl bg-white px-5 py-5 shadow-sm">
          {/* Line-by-line so tree chars (├──) and math coexist cleanly */}
          <div className="space-y-1.5">
            {content.split('\n').map((line, i) =>
              line.trim() === '' ? (
                <div key={i} className="h-2" />
              ) : (
                <MathContent
                  key={i}
                  content={line}
                  allowBlock={false}
                  className="block font-mono text-[13px] leading-relaxed text-ink"
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
