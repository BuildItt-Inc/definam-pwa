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
      <div className="mb-4 rounded-xl border-[1.5px] border-ink bg-card px-4 py-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink">
          Practice Question
        </p>
        <p className="font-bold text-[15px] font-bold leading-snug text-ink">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="mb-4 flex flex-col gap-2.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            tabIndex={revealed ? -1 : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-lg border-[1.5px] px-3.5 py-3 text-left  text-[13px] font-semibold transition-colors',
              isCorrectOpt(opt)
                ? 'border-ink bg-ink text-white'
                : isWrongSelected(opt)
                  ? 'border-danger bg-danger text-white'
                  : isOther(opt)
                    ? 'cursor-default border-border bg-card text-gray-300'
                    : 'border-border-2 bg-card text-ink active:bg-bg-0',
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
          className={`mb-5 rounded-lg px-4 py-3 text-[13px] leading-relaxed ${ gotItRight ? 'bg-ink/10 text-ink' : 'bg-danger-bg text-danger' }`}
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink py-3.5 text-[14px] font-bold text-white active:opacity-90"
        >
          {isLast ? 'Finish Practice' : 'Next Question'}
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
