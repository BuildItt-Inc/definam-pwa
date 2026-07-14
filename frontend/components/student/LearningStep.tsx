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
      {/* Step number + title row */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] bg-brand text-[13px] font-black text-white shadow-brand-sm">
          {step}
        </span>
        <span className="text-[16px] font-bold text-ink">{title}</span>
        {step === 2 && (
          <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-[6px] bg-brand/10 border border-brand/20 px-2 py-1 text-[10px] font-bold text-brand">
            <Flag size={10} strokeWidth={2} />
            Nigerian Context
          </span>
        )}
      </div>

      {/* ── Step 1 — Simple Definition ──────────────────────────────────── */}
      {step === 1 && (
        <div className="mb-3 rounded-2xl bg-card px-5 py-4 shadow-sm border border-border">
          <MathContent
            content={content}
            className="step-body text-[14.5px] leading-[1.75] text-ink"
          />
        </div>
      )}

      {/* ── Step 2 — Nigerian Example ────────────────────────────────────── */}
      {step === 2 && (
        <div className="mb-3 rounded-2xl border-l-[4px] border-brand bg-brand/5 px-5 py-5 shadow-sm">
          <MathContent
            content={content}
            className="step-body text-[14.5px] leading-[1.75] text-ink"
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
          <p className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-[11px] text-muted">
            Text diagrams only in V1 — image generation is V2.
          </p>
        </div>
      )}
    </div>
  );
}
