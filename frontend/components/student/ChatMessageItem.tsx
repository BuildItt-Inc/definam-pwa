'use client';

import { useEffect, useState } from 'react';
import { MathContent } from '@/components/student/MathContent';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSmoothedText } from '@/hooks/useSmoothedStream';
import type { ChatMessage } from '@/lib/api/chat';

const LONG_USER_CHAR_LIMIT = 280;
const LONG_USER_LINE_LIMIT = 6;

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

export function ChatMessageItem({
  message,
  isStreaming,
  onStreamAdvance,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  onStreamAdvance?: () => void;
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
        <ErrorBoundary
          fallback={
            <div className="text-[13px] text-danger">
              Failed to render message content.
            </div>
          }
        >
          <MathContent
            content={displayedText}
            allowBlock={true}
            isStreaming={isRevealing}
            className="text-[15px] leading-[1.72] text-ink [&_.math-para]:mb-3.5 [&_.math-para]:text-[15px] [&_.math-para]:leading-[1.72] [&_.math-para]:text-ink"
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
