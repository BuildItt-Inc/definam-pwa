'use client';

import { useState } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';
import type { PracticeQuestion as PracticeQuestionData } from '@/types/topics';
import { MathContent } from '@/components/student/MathContent';

type Option = 'A' | 'B' | 'C' | 'D';
const OPTIONS: Option[] = ['A', 'B', 'C', 'D'];

interface PracticeQuestionProps {
  question: PracticeQuestionData;
  onComplete: (correct: boolean) => void;
  isLast?: boolean;
}

export function PracticeQuestion({
  question,
  onComplete,
  isLast = false,
}: PracticeQuestionProps) {
  const [selected, setSelected] = useState<Option | null>(null);
  const [revealed, setRevealed] = useState(false);

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
      {/* Question card */}
      <div className="mb-4 rounded-2xl border-[1.5px] border-border bg-card px-5 py-5 shadow-sm">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">
          Practice Question
        </p>
        <MathContent
          content={question.question}
          allowBlock={false}
          className="text-[16px] font-bold leading-relaxed text-ink"
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
