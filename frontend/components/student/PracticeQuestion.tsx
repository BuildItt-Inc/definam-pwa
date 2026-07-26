'use client';

import { useState } from 'react';
import { Check, X, ChevronRight, MessageCircleQuestion } from 'lucide-react';
import type { PracticeQuestion as PracticeQuestionData } from '@/types/topics';
import { MathContent } from '@/components/student/MathContent';
import { useFloatingChat } from '@/components/student/FloatingChat/FloatingChatContext';
import { useSpotlight } from '@/hooks/useSpotlight';

type Option = 'A' | 'B' | 'C' | 'D';
const OPTIONS: Option[] = ['A', 'B', 'C', 'D'];

interface PracticeQuestionProps {
  question: PracticeQuestionData;
  onComplete: (correct: boolean) => void;
  isLast?: boolean;
  /** Passed along so "why is this wrong?" opens the chat with this topic's
   * context instead of a topic-less general chat. */
  topicId?: string;
}

export function PracticeQuestion({
  question,
  onComplete,
  isLast = false,
  topicId,
}: PracticeQuestionProps) {
  const { openChat } = useFloatingChat();
  const [selected, setSelected] = useState<Option | null>(null);
  const [revealed, setRevealed] = useState(false);
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  const handleSelect = (opt: Option) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
  };

  const isCorrectOpt = (opt: Option) => revealed && opt === question.answer;
  const isWrongSelected = (opt: Option) =>
    revealed && opt !== question.answer && opt === selected;
  const isOther = (opt: Option) =>
    revealed && !isCorrectOpt(opt) && !isWrongSelected(opt);

  const gotItRight = selected !== null && selected === question.answer;

  return (
    <div>
      {/* Question card — same spotlight-hover card treatment as the other
          learning steps, per the redesign; selection/reveal logic below is
          unchanged. */}
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        className="spotlight spotlight-card relative mb-4 overflow-hidden rounded-2xl border border-[#F3F4F6] bg-white px-5 py-5 shadow-sm"
      >
        <p className="relative z-10 mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">
          Practice Question
        </p>
        <MathContent
          content={question.question}
          allowBlock={false}
          className="relative z-10 text-[16px] font-bold leading-relaxed text-ink"
        />
      </div>

      {/* Options */}
      <div className="mb-4 flex flex-col gap-2.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            tabIndex={revealed ? -1 : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3.5 text-left text-[16px] font-semibold transition-all',
              isCorrectOpt(opt)
                ? 'border-brand bg-brand text-white shadow-brand-sm'
                : isWrongSelected(opt)
                  ? 'border-danger bg-danger text-white'
                  : isOther(opt)
                    ? 'cursor-default border-border bg-card text-muted opacity-60'
                    : 'border-border-2 bg-card text-ink hover:bg-bg-0 hover:border-brand/40 active:bg-bg-1',
            ].join(' ')}
          >
            <span className="flex-shrink-0 font-bold">{opt}.</span>
            <MathContent
              content={question.options[opt]}
              allowBlock={false}
              className="flex-1 text-inherit"
            />
            {isCorrectOpt(opt) && (
              <Check size={16} strokeWidth={2.5} className="flex-shrink-0" />
            )}
            {isWrongSelected(opt) && (
              <X size={16} strokeWidth={2.5} className="flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Explanation — shown after reveal */}
      {revealed && (
        <div
          className={`mb-6 rounded-xl px-5 py-4 text-[16px] leading-relaxed shadow-sm ${ gotItRight ? 'bg-brand/10 text-brand-dark' : 'bg-danger/10 text-danger-dark' }`}
        >
          <span className="font-bold">
            {gotItRight
              ? 'Correct! '
              : `Not quite — the answer is ${question.answer}. `}
          </span>
          <MathContent
            content={question.explanation}
            allowBlock={false}
            className="inline text-inherit"
          />
        </div>
      )}

      {/* "Why is this wrong?" — opens the floating chat pre-seeded with
          this specific question's context, instead of only the static
          explanation text above. */}
      {revealed && !gotItRight && selected && (
        <button
          type="button"
          onClick={() =>
            openChat({
              topicId,
              seedMessage: `I got this practice question wrong. The question was: "${question.question}". I answered "${question.options[selected]}" but the correct answer is "${question.options[question.answer]}". Can you explain why my answer was wrong and help me understand the correct one?`,
            })
          }
          className="mb-6 -mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border-2 bg-card py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-bg-0 active:bg-bg-1"
        >
          <MessageCircleQuestion size={16} strokeWidth={2} />
          Ask AI why this is wrong
        </button>
      )}

      {/* CTA — shown after reveal */}
      {revealed && (
        <button
          onClick={() => onComplete(gotItRight)}
          className="btn-primary w-full shadow-brand-sm"
        >
          {isLast ? 'Finish Practice' : 'Next Question'}
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
