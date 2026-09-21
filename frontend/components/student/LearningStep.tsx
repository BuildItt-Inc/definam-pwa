'use client';

import { Flag } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';
import { useSpotlight } from '@/hooks/useSpotlight';

interface LearningStepProps {
  step: 1 | 2 ; //removed step 3 might be added back later
  title: string;
  content: string;
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  return (
    <div>
      {/* Step number badge + category label (e.g. "Real-World Example") —
          matches the redesigned learning-interface preview's eyebrow row. */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-[13px] font-extrabold text-[#16A34A]">
          {step}
        </span>
        <span className="text-[13px] font-bold uppercase tracking-wide text-[#16A34A]">
          {title}
        </span>
      </div>

      {/* Content card — same spotlight-hover treatment regardless of step;
          internal rendering per step is unchanged (still MathContent /
          tree-marker line rendering exactly as before), only the outer
          wrapper's visual style changed. */}
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        className="spotlight spotlight-card relative mb-3 overflow-hidden rounded-2xl border border-[#F3F4F6] bg-white px-5 py-5 shadow-sm"
      >
        {step === 2 && (
          <span className="relative z-10 mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#FDF4E7] px-2.5 py-1 text-[11px] font-bold text-[#D97706]">
            <Flag size={12} strokeWidth={2} />
            Real-World Context
          </span>
        )}

        {/* ── Step 1 — Simple Definition ──────────────────────────────────── */}
        {step === 1 && (
          <div className="relative z-10">
            <MathContent
              content={content}
              className="step-body text-[14.5px] leading-[1.75] text-ink"
            />
          </div>
        )}

        {/* ── Step 2 — Real-World Example ───────────────────────────────────── */}
        {step === 2 && (
          <div className="relative z-10">
            <MathContent
              content={content}
              className="step-body text-[14.5px] leading-[1.75] text-ink"
            />
          </div>
        )}
      </div>
    </div>
  );
}
