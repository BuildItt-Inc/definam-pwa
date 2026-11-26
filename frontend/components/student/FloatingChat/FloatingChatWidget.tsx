'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  MessageCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ZikoraLogo } from '@/components/student/ZikoraLogo';
import { useFloatingChat } from './FloatingChatContext';
import { ChatMessageItem } from '@/components/student/ChatMessageItem';
import { useTopicChat } from '@/hooks/useTopicChat';
import { getStudentProfile } from '@/lib/utils/studentProfile';

const GENERAL_STARTER_PROMPTS = [
  { label: 'Explain a topic simply', prompt: 'Help me understand a tricky concept simply.' },
  {
    label: 'Quiz me',
    prompt: 'Quiz me with one multiple-choice question (options A, B, C, D) and score my answer.',
  },
  { label: 'Give me study tips', prompt: 'Give me a practical study plan for today.' },
];

const TOPIC_STARTER_PROMPTS = [
  { label: 'Explain it simply', prompt: 'Explain this topic in simple everyday terms.' },
  { label: 'Give me an example', prompt: 'Give me a worked example for this topic.' },
  {
    label: 'Quiz me',
    prompt: 'Quiz me on this topic one question at a time with options A, B, C, D and rate my answer.',
  },
];

/**
 * Labelled header button for launching Zikora.
 * Matches the Recall design system: neutral white/bordered chip with green sparkle.
 */
export function AskZikoraButton({
  topicId,
  className = '',
}: {
  topicId?: string;
  className?: string;
}) {
  const { openChat } = useFloatingChat();
  const params = useParams<{ topicId?: string }>();
  const resolvedTopicId = topicId ?? params?.topicId;

  return (
    <button
      type="button"
      onClick={() => openChat(resolvedTopicId ? { topicId: resolvedTopicId } : undefined)}
      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-ink shadow-2xs transition-all hover:bg-bg-2 active:scale-[0.97] ${className}`}
    >
      <Sparkles size={14} strokeWidth={2.2} className="text-brand flex-shrink-0" />
      <span>Ask Zikora</span>
    </button>
  );
}

/**
 * Global floating chat bubble + panel. Rendered once in the (student)
 * layout so it persists across navigation on both mobile and desktop.
 */
export function FloatingChatWidget() {
  const {
    isOpen,
    topicId,
    pendingSeedMessage,
    openChat,
    closeChat,
    consumeSeedMessage,
    isSuppressed,
  } = useFloatingChat();
  const params = useParams<{ topicId?: string }>();
  const currentPageTopicId = params?.topicId;
  const pathname = usePathname();

  const isOnChatPage = pathname === '/student/chat';

  return (
    <>
      {!isOpen && !isOnChatPage && !isSuppressed && (
        <button
          type="button"
          onClick={() => openChat(currentPageTopicId ? { topicId: currentPageTopicId } : undefined)}
          aria-label="Open Zikora AI tutor"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-on-ink shadow-xl transition-transform active:scale-95 md:bottom-6 md:right-6 hover:opacity-90"
        >
          <MessageCircle size={24} strokeWidth={2} />
        </button>
      )}

      {isOpen && (
        <FloatingChatPanel
          topicId={topicId}
          seedMessage={pendingSeedMessage}
          onSeedConsumed={consumeSeedMessage}
          onClose={closeChat}
        />
      )}
    </>
  );
}

function FloatingChatPanel({
  topicId,
  seedMessage,
  onSeedConsumed,
  onClose,
}: {
  topicId: string | undefined;
  seedMessage: string | undefined;
  onSeedConsumed: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const seedSentRef = useRef(false);

  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    confirmingClear,
    isClearing,
    quizScore,
    recordQuizOutcome,
    handleClearClick,
    submitMessage,
    handleSubmit,
    scrollContainerRef,
    messagesEndRef,
    showJumpToBottom,
    handleScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    jumpToBottom,
    followIfPinned,
  } = useTopicChat({ topicId });

  const profile = getStudentProfile();
  const studentName = profile?.name?.trim() || '';
  const starters = topicId ? TOPIC_STARTER_PROMPTS : GENERAL_STARTER_PROMPTS;

  // Lock background page scroll while chat is open (Android Chrome & iOS Safari)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Escape exits fullscreen first, then closes panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, onClose]);

  // Auto-send pre-seeded message immediately
  useEffect(() => {
    if (!seedMessage || seedSentRef.current) return;
    seedSentRef.current = true;
    onSeedConsumed();
    void submitMessage(seedMessage);
  }, [seedMessage, onSeedConsumed, submitMessage]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[70] flex overflow-hidden overscroll-none bg-bg-0'
          : 'fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px] md:items-stretch md:justify-end overflow-hidden overscroll-none touch-none'
      }
      onClick={(e) => {
        if (!isFullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          isFullscreen
            ? 'relative flex h-full w-full flex-col bg-bg-0 overscroll-none'
            : 'page-enter relative flex h-[min(88dvh,680px)] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-bg-0 shadow-2xl md:h-full md:w-[440px] md:rounded-none md:border-t-0 md:border-l overscroll-none'
        }
      >
        {/* ── Header ── */}
        <header
          className={`flex shrink-0 touch-none items-center gap-2.5 border-b border-border bg-card px-4 py-3 ${
            isFullscreen ? 'pt-[calc(env(safe-area-inset-top,0px)+12px)]' : ''
          }`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <ZikoraLogo size={26} className="text-ink" />
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <p className="font-bold text-[15.5px] text-ink leading-tight tracking-tight">Zikora</p>
            {quizScore.total > 0 && (
              <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand">
                {quizScore.correct}/{quizScore.total}
              </span>
            )}
          </div>

          {/* Clear button */}
          {messages.length > 0 &&
            (confirmingClear ? (
              <button
                type="button"
                onClick={handleClearClick}
                disabled={isClearing}
                className="flex-shrink-0 whitespace-nowrap rounded-lg bg-danger-bg px-2.5 py-1.5 text-[11px] font-bold text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
              >
                Clear chat?
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearClick}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg-2 hover:text-ink active:scale-95"
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            ))}

          {/* Expand / Open full workspace on desktop or fullscreen on mobile */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                onClose();
                router.push(topicId ? `/student/chat?topicId=${encodeURIComponent(topicId)}` : '/student/chat');
              } else {
                setIsFullscreen((f) => !f);
              }
            }}
            aria-label={isFullscreen ? 'Exit full screen' : 'Expand workspace'}
            title={isFullscreen ? 'Exit full screen' : 'Expand to workspace'}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg-2 hover:text-ink active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 size={15} strokeWidth={2} />
            ) : (
              <Maximize2 size={15} strokeWidth={2} />
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg-2 hover:text-ink active:scale-95"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        {/* ── Messages scroll area ── */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="relative flex-1 overflow-y-auto overscroll-contain touch-pan-y pb-8 pt-4"
        >
          <div
            className={`flex min-h-full w-full flex-col gap-6 ${
              isFullscreen ? 'mx-auto max-w-3xl px-5 md:px-10' : 'px-4'
            }`}
          >
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center my-auto py-8 px-4">
                <ZikoraLogo size={40} className="text-ink" />
                <div>
                  <p className="text-[16px] font-bold text-ink tracking-tight">
                    Hi{studentName ? `, ${studentName}` : ''} — I&apos;m Zikora
                  </p>
                  <p className="text-[13.5px] text-muted mt-1 max-w-[270px] leading-relaxed">
                    {topicId
                      ? 'Ask me anything about this topic, or pick a prompt below.'
                      : 'Ask me anything — study tips, tricky concepts, or a quick interactive quiz.'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {starters.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => void submitMessage(s.prompt)}
                      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-ink shadow-2xs hover:bg-bg-2 active:scale-[0.97] transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                const isLastAssistant = isLast && msg.role === 'assistant';
                return (
                  <ChatMessageItem
                    key={index}
                    message={msg}
                    isStreaming={isLastAssistant && isLoading}
                    interactiveDisabled={isLoading || !isLast}
                    onStreamAdvance={followIfPinned}
                    onSelectOption={(reply) => void submitMessage(reply)}
                    onScored={recordQuizOutcome}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ── Centered circular jump-to-bottom button ── */}
        {showJumpToBottom && (
          <button
            type="button"
            onClick={jumpToBottom}
            aria-label="Jump to bottom"
            className="absolute bottom-[94px] left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-ink shadow-md transition-all hover:bg-bg-2 active:scale-95"
          >
            <ArrowDown size={16} strokeWidth={2.2} />
          </button>
        )}

        {/* ── Input ── */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 overscroll-none border-t border-border bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] md:pb-5 w-full box-border"
        >
          <div
            className={`flex items-center gap-2.5 rounded-2xl border border-border-2 bg-bg-0 px-3.5 py-2.5 min-h-[48px] focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/5 transition-all w-full max-w-full box-border ${
              isFullscreen ? 'mx-auto max-w-3xl' : ''
            }`}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              placeholder="Ask Zikora"
              className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[14.5px] leading-normal placeholder:text-faint focus:outline-none text-ink disabled:opacity-50 touch-manipulation"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-on-ink transition-all hover:opacity-90 disabled:bg-bg-2 disabled:text-faint active:scale-95"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
