'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
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
import {
  getChatHistory,
  getCachedChatHistory,
  setCachedChatHistory,
  sendChatMessageStream,
  clearChatHistory,
  ChatError,
  type ChatMessage,
} from '@/lib/api/chat';
import { ChatMessageItem } from '@/components/student/ChatMessageItem';
import { useSmartChatScroll } from '@/hooks/useSmoothedStream';
import { toast } from '@/lib/toast';

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
 * layout so it persists across navigation.
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
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-xl transition-transform active:scale-95 md:bottom-6 hover:bg-[#1f3029]"
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getCachedChatHistory(topicId) || [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    scrollContainerRef,
    messagesEndRef,
    showJumpToBottom,
    handleScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    jumpToBottom,
    pinToBottom,
    followIfPinned,
  } = useSmartChatScroll();

  const seedSentRef = useRef(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
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

  // Fetch history in background silently without blocking the UI
  useEffect(() => {
    seedSentRef.current = false;
    let isCurrent = true;

    getChatHistory(topicId)
      .then((history) => {
        if (!isCurrent) return;
        if (history && history.length > 0) {
          setMessages(history);
          setCachedChatHistory(topicId, history);
        }
      })
      .catch(() => {
        // Keep whatever cached messages or empty state we have
      });

    return () => {
      isCurrent = false;
    };
  }, [topicId]);

  // Scroll to bottom on initial mount or when message count changes (if pinned)
  useEffect(() => {
    followIfPinned();
  }, [messages.length, followIfPinned]);

  const handleClearClick = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClear(false), 5000);
      return;
    }
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirmingClear(false);
    setIsClearing(true);
    clearChatHistory(topicId)
      .then(() => {
        setMessages([]);
        setCachedChatHistory(topicId, []);
      })
      .catch(() => toast.error('Could not clear chat', 'Please try again.'))
      .finally(() => setIsClearing(false));
  };

  const submitMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);

    setMessages((prev) => {
      const next: ChatMessage[] = [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: '' },
      ];
      setCachedChatHistory(topicId, next);
      return next;
    });

    pinToBottom();

    let responseAccumulator = '';

    try {
      await sendChatMessageStream(
        topicId,
        query,
        (chunk) => {
          responseAccumulator += chunk;
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (next[lastIdx]?.role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content: responseAccumulator,
              };
            }
            setCachedChatHistory(topicId, next);
            return next;
          });
        },
        () => {
          setIsLoading(false);
        },
        (err) => {
          setIsLoading(false);
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              const pruned = prev.slice(0, -1);
              setCachedChatHistory(topicId, pruned);
              return pruned;
            }
            return prev;
          });
          if (err instanceof ChatError && err.status === 429) {
            toast.error('Daily chat limit reached', err.message);
          } else if (err instanceof ChatError && err.status >= 500) {
            toast.error('AI Tutor Temporarily Busy', err.message);
          } else {
            toast.error('Message failed to send', err?.message || 'Check your connection and try again.');
          }
        },
      );
    } catch {
      setIsLoading(false);
    }
  };

  // Auto-send pre-seeded message immediately
  useEffect(() => {
    if (!seedMessage || seedSentRef.current) return;
    seedSentRef.current = true;
    onSeedConsumed();
    void submitMessage(seedMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query) return;
    setInputMessage('');
    void submitMessage(query);
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[70] flex overflow-hidden overscroll-none bg-bg-0'
          : 'fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 backdrop-blur-[2px] md:items-stretch md:justify-end overflow-hidden overscroll-none'
      }
      onClick={(e) => {
        if (!isFullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          isFullscreen
            ? 'relative flex h-full w-full flex-col bg-bg-0'
            : 'page-enter relative flex h-[min(88dvh,680px)] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-bg-0 shadow-2xl md:h-full md:w-[440px] md:rounded-none md:border-t-0 md:border-l'
        }
      >
        {/* ── Header ── */}
        <header
          className={`flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 py-3 ${
            isFullscreen ? 'pt-[calc(env(safe-area-inset-top,0px)+12px)]' : ''
          }`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <ZikoraLogo size={26} className="text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15.5px] text-ink leading-tight tracking-tight">Zikora</p>
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

          {/* Expand / Exit Fullscreen */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            aria-label={isFullscreen ? 'Exit full screen' : 'Expand to full screen'}
            title={isFullscreen ? 'Exit full screen' : 'Expand to full screen'}
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
          className="relative flex-1 overflow-y-auto pb-8 pt-4"
        >
          <div
            className={`flex min-h-full w-full flex-col gap-6 ${
              isFullscreen ? 'mx-auto max-w-3xl px-5 md:px-10' : 'px-4'
            }`}
          >
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center my-auto py-10 px-4">
                <ZikoraLogo size={40} className="text-ink" />
                <div>
                  <p className="text-[16px] font-bold text-ink tracking-tight">Hi, I&apos;m Zikora</p>
                  <p className="text-[13.5px] text-muted mt-1 max-w-[260px] leading-relaxed">
                    {topicId
                      ? 'Ask me anything about this topic — explanations, definitions, or exam questions.'
                      : "Ask me anything — study tips, tricky concepts, or questions you're stuck on."}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isLastAssistant =
                  index === messages.length - 1 && msg.role === 'assistant';
                return (
                  <ChatMessageItem
                    key={index}
                    message={msg}
                    isStreaming={isLastAssistant && isLoading}
                    onStreamAdvance={followIfPinned}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ── Centered circular jump-to-bottom button (matches reference UI) ── */}
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
          className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] md:pb-5 w-full box-border"
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
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-white transition-all hover:bg-[#1f3029] disabled:bg-bg-2 disabled:text-faint active:scale-95"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
