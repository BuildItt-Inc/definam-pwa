'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Flag } from 'lucide-react';

interface LearningStepProps {
  step: 1 | 2 | 3;
  title: string;
  content: string;
}

function hasHtmlTags(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export function LearningStep({ step, title, content }: LearningStepProps) {
  const isHtml = hasHtmlTags(content);

  const body = isHtml ? (
    <p
      className="font-dm-sans text-[14px] leading-relaxed text-ink"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  ) : (
    <p className="font-dm-sans text-[14px] leading-relaxed text-ink">{content}</p>
  );

  return (
    <div>
      {/* Step number + title row */}
      <div className="mb-3 flex items-center gap-2">
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

      {/* Step 1 — plain content card on white */}
      {step === 1 && (
        <div className="mb-3 rounded-lg bg-card px-4 py-3.5 shadow-sm">{body}</div>
      )}

      {/* Step 2 — jade left-border accent card */}
      {step === 2 && (
        <div className="mb-3 rounded-r-lg border-l-4 border-jade bg-jade/10 py-3.5 pl-4 pr-4">
          {body}
        </div>
      )}

      {/* Step 3 — monospace code-style card, preserve line breaks */}
      {step === 3 && (
        <>
          <div className="mb-2 rounded-lg bg-card p-4">
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-loose text-ink">
              {content}
            </pre>
          </div>
          <p className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 font-dm-sans text-[11px] text-muted">
            Text diagrams only in V1 — image generation is V2.
          </p>
        </>
      )}
    </div>
  );
}
