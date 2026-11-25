'use client';

import { Flag, Lightbulb } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';

interface LearningStepProps {
  step: 1 | 2;
  title: string;
  content: string;
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  return (
    <div>
      {/* Step eyebrow */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-tint text-[12px] font-bold text-brand">
          {step}
        </span>
        <span className="text-[12.5px] font-bold uppercase tracking-wider text-brand">
          {title}
        </span>
      </div>

      {/* Content surface — 16.5px text / ~28px line-height for effortless reading */}
      <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-2xs">
        {step === 1 && (
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-md bg-brand-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand">
            <Lightbulb size={12} strokeWidth={2.2} />
            <span>Explanation</span>
          </div>
        )}

        {step === 2 && (
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-md bg-warn-bg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-warn">
            <Flag size={12} strokeWidth={2.2} />
            <span>Real-World Example</span>
          </div>
        )}

        <MathContent
          content={content}
          className="step-body text-[16.5px] leading-[1.7] text-ink"
        />
      </div>
    </div>
  );
}
