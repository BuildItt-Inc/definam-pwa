'use client';

import { Flag } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';
import { useSpotlight } from '@/hooks/useSpotlight';

interface LearningStepProps {
  step: 1 | 2 | 3;
  title: string;
  content: string;
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  return (
    <div>
      {/* Step number badge + category label (e.g. "Nigerian Example") —
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
            Nigerian Context
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

        {/* ── Step 2 — Nigerian Example ────────────────────────────────────── */}
        {step === 2 && (
          <div className="relative z-10">
            <MathContent
              content={content}
              className="step-body text-[14.5px] leading-[1.75] text-ink"
            />
          </div>
        )}

        {/* ── Step 3 — Visual Breakdown ────────────────────────────────────── */}
        {step === 3 && (
          <div className="relative z-10">
            {/* Line-by-line so tree chars (├──/└──) and math coexist cleanly */}
            <div className="space-y-1.5">
              {content.split('\n').map((line, i) => {
                if (line.trim() === '') return <div key={i} className="h-2" />;

                // Indent width before a connector varies (AI output isn't a fixed
                // 4-char grid — seen 3, 4, and 5 spaces after "│" in practice), so
                // match indent units loosely and count them rather than dividing
                // a fixed-width prefix length.
                const treeMatch = line.match(/^((?:│\s*|\s{2,})*)(├──|└──)\s*(?:•\s*)?(.*)$/);
                if (treeMatch) {
                  const [, indent, connector, rest] = treeMatch;
                  const depth = (indent.match(/│\s*|\s{2,}/g) || []).length;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-1.5"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      <span className="flex-shrink-0 select-none font-mono text-ink/30">
                        {connector}
                      </span>
                      <MathContent
                        content={rest}
                        allowBlock={false}
                        className="font-mono text-[15px] leading-relaxed text-ink"
                      />
                    </div>
                  );
                }

                return (
                  <MathContent
                    key={i}
                    content={line}
                    allowBlock={false}
                    className="block font-mono text-[15px] leading-relaxed text-ink"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
