'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Bot, MessageCircle, ArrowUp, Trash2, X, ChevronDown } from 'lucide-react';
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
import { MathContent } from '@/components/student/MathContent';
import { getFollowUpSuggestions } from '@/lib/utils/chatFollowUps';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { toast } from '@/lib/toast';

/**
 * Global floating chat bubble + panel. Rendered once in the (student)
 * layout so it persists across navigation. Button always visible; panel
 * content opens immediately with background history sync.
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
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-xl transition-transform active:scale-95 md:bottom-6 hover:bg-ink/90"
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

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: '150ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: '300ms' }} />
    </div>
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
  // Initialize with cached messages if available so the window opens instantly with 0ms delay
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getCachedChatHistory(topicId) || [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const scrollContainerRef = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const seedSentRef = useRef(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

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

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is more than 60px from bottom, they have scrolled up to read
    const isScrolledUp = distanceFromBottom > 60;
    isUserScrolledUpRef.current = isScrolledUp;
    setShowScrollBottomBtn(isScrolledUp && distanceFromBottom > 120);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
    isUserScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
  }, []);

  // Smart scroll effect: DO NOT snatch user's scroll down during streaming if they scrolled up!
  useEffect(() => {
    if (isUserScrolledUpRef.current) {
      // User is reading earlier content — leave viewport exactly where it is!
      return;
    }
    const el = scrollContainerRef.current;
    if (el) {
      // Direct scroll assignment keeps up with rapid SSE streaming without jitter
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

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

    // Atomically append user message and placeholder assistant bubble
    setMessages((prev) => {
      const next: ChatMessage[] = [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: '' },
      ];
      setCachedChatHistory(topicId, next);
      return next;
    });

    // Reset user scroll so they see their question and the start of the response
    isUserScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

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
            // If the assistant message is still completely empty, drop it
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

  // Auto-send pre-seeded message immediately without waiting for background fetch
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 sm:items-end sm:justify-end sm:bg-transparent sm:p-6 overflow-hidden overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="page-enter relative flex h-[min(85dvh,640px)] max-h-[100dvh] w-full max-w-full sm:max-w-md flex-col overflow-hidden rounded-t-2xl border-0 bg-card shadow-2xl sm:h-[560px] sm:rounded-2xl">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 160%)' }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <Bot size={18} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] text-white">Zikora</p>
            <p className="truncate text-[12px] text-white/50">
              {topicId ? 'Chatting about this topic' : 'General study help'}
            </p>
          </div>
          {messages.length > 0 &&
            (confirmingClear ? (
              <button
                type="button"
                onClick={handleClearClick}
                disabled={isClearing}
                className="flex-shrink-0 whitespace-nowrap rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold text-red-200 transition-colors hover:bg-white/25 disabled:opacity-50"
              >
                Clear chat?
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearClick}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="flex-shrink-0 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            ))}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex-shrink-0 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {/* Messages */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center my-auto py-10 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dim border border-brand/20">
                <Bot size={24} strokeWidth={1.8} className="text-brand" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-ink">Hi, I&apos;m Zikora</p>
                <p className="text-[13px] text-muted mt-1 max-w-[260px] leading-relaxed">
                  {topicId
                    ? 'Ask me anything about this topic — explanations, definitions, or exam questions.'
                    : "Ask me anything — study tips, tricky concepts, or questions you're stuck on."}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isLastBubble = index === messages.length - 1;
              const showThinking =
                msg.role === 'assistant' && isLastBubble && isLoading && msg.content === '';

              return (
                <div
                  key={index}
                  className={`flex items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-ink text-white'
                        : 'rounded-bl-sm border border-border-2 bg-card text-ink'
                    }`}
                  >
                    {showThinking ? (
                      <ThinkingDots />
                    ) : (
                      <ErrorBoundary
                        fallback={
                          <div className="text-[13px] text-red-500">
                            Failed to render message content.
                          </div>
                        }
                      >
                        <MathContent
                          content={msg.content}
                          allowBlock={false}
                          isStreaming={msg.role === 'assistant' && isLastBubble && isLoading && msg.content !== ''}
                          className={`text-[14px] leading-relaxed [&_.math-para]:mb-0 [&_.math-para]:text-[14px] ${
                            msg.role === 'user' ? 'text-white [&_.math-para]:text-white' : 'text-ink'
                          }`}
                        />
                      </ErrorBoundary>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating "Scroll to bottom" button if user scrolled up to read while stream arrives */}
        {showScrollBottomBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            aria-label="Scroll to latest messages"
            className="absolute bottom-16 right-4 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg border border-white/20 transition-all hover:bg-ink/90 active:scale-95"
          >
            <ChevronDown size={14} strokeWidth={2.5} />
            <span>Latest</span>
          </button>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border px-3 py-2.5 sm:px-4 sm:py-3 w-full max-w-full box-border bg-card shrink-0"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border-2 bg-bg-1 px-3 py-2 sm:px-4 sm:py-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all w-full max-w-full box-border">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              placeholder="Ask Zikora"
              className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[14px] leading-normal placeholder:text-faint focus:outline-none text-ink disabled:opacity-50 touch-manipulation"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:bg-bg-2 disabled:text-faint active:scale-95"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
