'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { MathContent } from '@/components/student/MathContent';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSmoothedText } from '@/hooks/useSmoothedStream';
import type { ChatMessage } from '@/lib/api/chat';

const LONG_USER_CHAR_LIMIT = 280;
const LONG_USER_LINE_LIMIT = 6;

// ── Quiz Parser ───────────────────────────────────────────────────────────────

interface QuizOption {
  label: string; // A, B, C, D
  text: string;
}

interface QuizBlock {
  question: string;
  options: QuizOption[];
  answerLabel?: string;
}

interface ParsedContent {
  before: string;
  quiz: QuizBlock | null;
  after: string;
}

function parseExplicitQuizBlock(text: string): ParsedContent | null {
  const startTag = '[QUIZ]';
  const endTag = '[/QUIZ]';
  const startIdx = text.indexOf(startTag);
  const endIdx = text.indexOf(endTag);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const before = text.slice(0, startIdx).trim();
  const after = text.slice(endIdx + endTag.length).trim();
  const inner = text.slice(startIdx + startTag.length, endIdx).trim();
  const lines = inner.split('\n').map((l) => l.trim()).filter(Boolean);

  let question = '';
  const options: QuizOption[] = [];
  let answerLabel = '';

  for (const line of lines) {
    if (/^Q:/i.test(line)) {
      question = line.replace(/^Q:/i, '').trim();
    } else if (/^ANSWER:/i.test(line)) {
      answerLabel = line.replace(/^ANSWER:/i, '').trim().toUpperCase();
    } else {
      const match = line.match(/^(?:\*{0,2})([A-D])(?:\*{0,2})[\.\):]\s+(.+)/i);
      if (match) {
        options.push({ label: match[1].toUpperCase(), text: match[2].trim() });
      }
    }
  }

  if (!question || options.length < 2) {
    return null;
  }

  return { before, quiz: { question, options, answerLabel: answerLabel || undefined }, after };
}

/**
 * Fallback parser for natural LLM multiple-choice messages (e.g. when Zikora
 * asks a question followed by A) ..., B) ..., C) ..., D) ...).
 */
function parseMarkdownOptionsBlock(text: string): ParsedContent | null {
  // Skip messages that already spoil/reveal the answer inline
  if (/(?:correct\s+answer|the\s+answer\s+is)\s*[:\-]/i.test(text)) {
    return null;
  }

  const lines = text.split('\n');
  const optionLineRegex = /^\s*(?:[-*]\s+)?(?:\*{0,2})([A-D])(?:\*{0,2})[\.\)]\s+(.+)$/;

  let blockStart = -1;
  let blockEnd = -1;
  const options: QuizOption[] = [];
  const expectedOrder = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(optionLineRegex);
    if (match) {
      const label = match[1].toUpperCase();
      if (options.length === 0 && label === 'A') {
        blockStart = i;
        blockEnd = i;
        options.push({ label, text: match[2].trim() });
      } else if (options.length > 0 && label === expectedOrder[options.length]) {
        blockEnd = i;
        options.push({ label, text: match[2].trim() });
      }
    } else if (options.length > 0 && lines[i].trim() !== '') {
      // Stop collecting if non-empty non-option text interrupts
      break;
    }
  }

  // Require at least A, B, C (3 consecutive options) so normal prose isn't misdetected
  if (options.length < 3 || blockStart === -1) {
    return null;
  }

  const before = lines.slice(0, blockStart).join('\n').trim();
  const after = lines.slice(blockEnd + 1).join('\n').trim();

  return {
    before,
    quiz: {
      question: '',
      options,
    },
    after,
  };
}

function parseQuizBlock(text: string): ParsedContent {
  return (
    parseExplicitQuizBlock(text) ??
    parseMarkdownOptionsBlock(text) ?? {
      before: text,
      quiz: null,
      after: '',
    }
  );
}

// ── Quiz Card ─────────────────────────────────────────────────────────────────

function QuizCard({
  quiz,
  disabled,
  onSelectOption,
  onScored,
}: {
  quiz: QuizBlock;
  disabled?: boolean;
  onSelectOption?: (replyText: string) => void;
  onScored?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const hasAnswerKey = Boolean(quiz.answerLabel);

  const handleSelect = (opt: QuizOption) => {
    if (answered || disabled) return;
    setSelected(opt.label);

    if (hasAnswerKey && quiz.answerLabel) {
      onScored?.(opt.label === quiz.answerLabel);
    }

    if (onSelectOption) {
      onSelectOption(`My answer is ${opt.label}: ${opt.text}`);
    }
  };

  return (
    <div className="my-2 rounded-2xl border border-border bg-bg-0/70 overflow-hidden">
      {quiz.question && (
        <div className="px-4 pt-3.5 pb-3 border-b border-border bg-brand-tint/35">
          <p className="text-[10.5px] font-bold text-brand uppercase tracking-widest mb-1">
            Interactive check
          </p>
          <p className="text-[14.5px] font-semibold text-ink leading-snug">{quiz.question}</p>
        </div>
      )}

      <div className="p-3 flex flex-col gap-2">
        {quiz.options.map((opt) => {
          const isSelected = selected === opt.label;
          const isCorrect = hasAnswerKey && opt.label === quiz.answerLabel;

          let optClass =
            'flex items-center gap-3 w-full rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-all';

          if (!answered) {
            optClass += disabled
              ? ' border-border bg-card text-muted cursor-not-allowed opacity-70'
              : ' border-border bg-card text-ink hover:bg-bg-2 hover:border-ink/25 active:scale-[0.985] cursor-pointer';
          } else if (hasAnswerKey) {
            if (isCorrect) {
              optClass += ' border-brand bg-brand-tint text-brand cursor-default';
            } else if (isSelected) {
              optClass += ' border-danger/40 bg-danger-bg text-danger cursor-default';
            } else {
              optClass += ' border-border bg-card text-muted cursor-default opacity-50';
            }
          } else if (isSelected) {
            optClass += ' border-brand bg-brand-tint text-brand cursor-default';
          } else {
            optClass += ' border-border bg-card text-muted cursor-default opacity-60';
          }

          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleSelect(opt)}
              disabled={answered || disabled}
              className={optClass}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  answered && hasAnswerKey && isCorrect
                    ? 'bg-brand text-white'
                    : answered && hasAnswerKey && isSelected && !isCorrect
                    ? 'bg-danger text-white'
                    : answered && isSelected
                    ? 'bg-brand text-white'
                    : 'bg-bg-2 text-muted'
                }`}
              >
                {answered && hasAnswerKey && isCorrect ? (
                  <Check size={12} strokeWidth={3} />
                ) : answered && hasAnswerKey && isSelected && !isCorrect ? (
                  <X size={12} strokeWidth={3} />
                ) : (
                  opt.label
                )}
              </span>
              <span className="flex-1 leading-snug">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {answered && hasAnswerKey && (
        <div
          className={`mx-3 mb-3 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold ${
            selected === quiz.answerLabel
              ? 'bg-brand-tint text-brand'
              : 'bg-danger-bg text-danger'
          }`}
        >
          {selected === quiz.answerLabel
            ? 'Correct! Well done.'
            : `Not quite — answer is ${quiz.answerLabel}: ${
                quiz.options.find((o) => o.label === quiz.answerLabel)?.text ?? ''
              }`}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2" aria-label="Zikora is thinking">
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60" style={{ animationDelay: '160ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand/60" style={{ animationDelay: '320ms' }} />
    </div>
  );
}

function UserMessageCard({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const lineCount = content.split('\n').length;
  const isLong = content.length > LONG_USER_CHAR_LIMIT || lineCount > LONG_USER_LINE_LIMIT;

  return (
    <div className="flex justify-end">
      <div className="relative max-w-[85%] rounded-2xl border border-[#E5E3DC] bg-[#EFECE6] px-4 py-2.5 text-ink">
        <div className={!expanded && isLong ? 'max-h-[168px] overflow-hidden relative' : ''}>
          <p className="text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">
            {content}
          </p>
          {!expanded && isLong && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#EFECE6] via-[#EFECE6]/85 to-transparent"
            />
          )}
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1 text-[12.5px] font-medium text-muted hover:text-ink transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Assistant message with optional embedded quiz ─────────────────────────────

function AssistantContent({
  displayedText,
  isRevealing,
  interactiveDisabled,
  onSelectOption,
  onScored,
}: {
  displayedText: string;
  isRevealing: boolean;
  interactiveDisabled?: boolean;
  onSelectOption?: (replyText: string) => void;
  onScored?: (correct: boolean) => void;
}) {
  const { before, quiz, after } = parseQuizBlock(displayedText);

  return (
    <div className="w-full min-w-0 space-y-1">
      {before && (
        <ErrorBoundary fallback={<div className="text-[13px] text-danger">Failed to render.</div>}>
          <MathContent
            content={before}
            allowBlock={true}
            isStreaming={isRevealing}
            className="text-[15px] leading-[1.72] text-ink [&_.math-para]:mb-3.5 [&_.math-para]:text-[15px] [&_.math-para]:leading-[1.72] [&_.math-para]:text-ink"
          />
        </ErrorBoundary>
      )}
      {quiz && !isRevealing && (
        <QuizCard
          quiz={quiz}
          disabled={interactiveDisabled}
          onSelectOption={onSelectOption}
          onScored={onScored}
        />
      )}
      {after && (
        <ErrorBoundary fallback={<div className="text-[13px] text-danger">Failed to render.</div>}>
          <MathContent
            content={after}
            allowBlock={true}
            isStreaming={false}
            className="text-[15px] leading-[1.72] text-ink [&_.math-para]:mb-3.5 [&_.math-para]:text-[15px] [&_.math-para]:leading-[1.72] [&_.math-para]:text-ink"
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ChatMessageItem({
  message,
  isStreaming,
  interactiveDisabled = false,
  onStreamAdvance,
  onSelectOption,
  onScored,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  interactiveDisabled?: boolean;
  onStreamAdvance?: () => void;
  onSelectOption?: (replyText: string) => void;
  onScored?: (correct: boolean) => void;
}) {
  const { displayedText, isRevealing } = useSmoothedText(message.content, isStreaming);

  useEffect(() => {
    if (isRevealing) {
      onStreamAdvance?.();
    }
  }, [displayedText, isRevealing, onStreamAdvance]);

  if (message.role === 'user') {
    return <UserMessageCard content={message.content} />;
  }

  const showThinking = isStreaming && message.content === '';

  return (
    <div className="w-full min-w-0">
      {showThinking ? (
        <ThinkingDots />
      ) : (
        <AssistantContent
          displayedText={displayedText}
          isRevealing={isRevealing}
          interactiveDisabled={interactiveDisabled}
          onSelectOption={onSelectOption}
          onScored={onScored}
        />
      )}
    </div>
  );
}
