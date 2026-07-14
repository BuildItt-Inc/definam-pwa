'use client';

import { Flag } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';

interface LearningStepProps {
  step: 1 | 2 | 3;
  title: string;
  content: string;
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  const isHtml = hasHtmlTags(content);

  const body = isHtml ? (
    <p
      className="text-[14px] leading-relaxed text-ink"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  ) : (
    <p className="text-[14px] leading-relaxed text-ink">{content}</p>
  );

  return (
    <div>
      {/* Step number + title row */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-ink font-bold text-[11px] font-black text-white">
          {step}
        </span>
        <span className="font-bold text-[15px] font-bold text-ink">{title}</span>
        {step === 2 && (
          <span className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-[3px] bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Flag size={9} strokeWidth={2} />
            Nigerian Context
          </span>
        )}
      </div>

      {/* ── Step 1 — Simple Definition ──────────────────────────────────── */}
      {step === 1 && (
        <div className="mb-3 rounded-lg bg-card px-4 py-3.5 shadow-sm">{body}</div>
      )}

      {/* Step 2 — jade left-border accent card */}
      {step === 2 && (
        <div className="mb-3 rounded-r-lg border-l-4 border-ink bg-ink/10 py-3.5 pl-4 pr-4">
          {body}
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
          <p className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-[11px] text-muted">
            Text diagrams only in V1 — image generation is V2.
          </p>
        </>
      )}
    </div>
  );
}
