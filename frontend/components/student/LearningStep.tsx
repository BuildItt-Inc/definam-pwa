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
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[14px] font-bold text-white shadow-sm">
          {step}
        </span>
        <span className="text-[16px] font-bold text-ink">{title}</span>
        {step === 2 && (
          <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-full bg-brand/5 border border-brand/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
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
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-brand/5 to-card px-5 py-5 shadow-sm border border-border"
          >
          <MathContent
            content={content}
            className="step-body text-[14.5px] leading-[1.75] text-ink"
          />
        </div>
      )}

      {/* ── Step 3 — Visual Breakdown ────────────────────────────────────── */}
      {step === 3 && (
        <div className="rounded-2xl bg-white px-5 py-5 shadow-sm">
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
  );
}
