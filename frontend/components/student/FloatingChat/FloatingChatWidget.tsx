'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bot, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { useFloatingChat } from './FloatingChatContext';
import {
  getChatHistory,
  sendChatMessageStream,
  clearChatHistory,
  ChatError,
  type ChatMessage,
} from '@/lib/api/chat';
import { MathContent } from '@/components/student/MathContent';
import { toast } from '@/lib/toast';

/**
 * Global floating chat bubble + panel. Rendered once in the (student)
 * layout so it persists across navigation. Button always visible; panel
 * content resets each time it's opened for a given topic context (no
 * cross-session persistence yet — reactive only, per this iteration's scope).
 */
export function FloatingChatWidget() {
  const { isOpen, topicId, pendingSeedMessage, openChat, closeChat, consumeSeedMessage } =
    useFloatingChat();
  // On a topic page, default the launcher button to that topic's context
  // so tapping it "just works" without needing an explicit openChat() call
  // from the page itself.
  const params = useParams<{ topicId?: string }>();
  const currentPageTopicId = params?.topicId;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => openChat(currentPageTopicId ? { topicId: currentPageTopicId } : undefined)}
          aria-label="Open AI tutor chat"
          // z-[60], not z-50: BottomNav portals directly to document.body,
          // which places it later in DOM order than this button's normal
          // (non-portaled) position. Equal z-index falls back to DOM order
          // for stacking, so at z-50 the nav — despite being visually
          // "lower" on the page — would render on top of and hide this
          // button. An explicit higher z-index makes the stacking
          // unambiguous regardless of DOM order or future rendering changes
          // to either element.
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-xl transition-transform active:scale-95 md:bottom-6"
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

// Classic three-dot "typing" indicator. Rendered *inside* the same bubble
// that will hold the streamed response (see the empty-content check in the
// message loop below) — never a separate element — so there's exactly one
// bubble per turn at all times, and it visually morphs from dots to text
// as chunks arrive instead of two elements swapping.
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: '150ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: '300ms' }} />
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seedSentRef = useRef(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

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
      .then(() => setMessages([]))
      .catch(() => toast.error('Could not clear chat', 'Please try again.'))
      .finally(() => setIsClearing(false));
  };

  useEffect(() => {
    setIsHistoryLoading(true);
    seedSentRef.current = false;
    getChatHistory(topicId)
      .then((history) => setMessages(history))
      .catch(() => setMessages([]))
      .finally(() => setIsHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submitMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);

    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);
    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    let responseAccumulator = '';

    await sendChatMessageStream(
      topicId,
      query,
      (chunk) => {
        responseAccumulator += chunk;
        setMessages((prev) => {
          const next = [...prev];
          if (next[assistantIndex]) next[assistantIndex].content = responseAccumulator;
          return next;
        });
      },
      () => setIsLoading(false),
      (err) => {
        // Drop the empty assistant placeholder — nothing came back.
        setMessages((prev) => prev.slice(0, assistantIndex));
        setIsLoading(false);
        if (err instanceof ChatError && err.status === 429) {
          toast.error('Daily chat limit reached', err.message);
        } else {
          toast.error('Message failed to send', 'Check your connection and try again.');
        }
      },
    );
  };

  // Auto-send the pre-seeded message once, after history has loaded.
  useEffect(() => {
    if (!seedMessage || isHistoryLoading || seedSentRef.current) return;
    seedSentRef.current = true;
    onSeedConsumed();
    void submitMessage(seedMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMessage, isHistoryLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query) return;
    setInputMessage('');
    void submitMessage(query);
  };

  return (
    // z-[60], same reasoning as the launcher button above: BottomNav's
    // portal to document.body would otherwise render on top of this panel's
    // bottom edge (input box, send button) at equal z-index.
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 sm:items-end sm:justify-end sm:bg-transparent sm:p-6">
      <div className="page-enter flex h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border-2 bg-card shadow-2xl sm:h-[560px] sm:rounded-2xl">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 160%)' }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <Bot size={18} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] text-white">AI Tutor</p>
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
        <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4 space-y-4">
          {isHistoryLoading ? (
            <p className="text-center text-[13px] text-muted">Loading…</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <Bot size={28} strokeWidth={1.5} className="text-ink/30" />
              <p className="text-[13px] text-muted">
                {topicId
                  ? "Ask me anything about this topic."
                  : "Ask me anything — study tips, a topic you're stuck on, anything."}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isLastBubble = index === messages.length - 1;
              // The assistant's placeholder bubble is inserted empty the
              // moment a question is sent, then filled in as chunks stream
              // in. While it's still empty and a request is in flight, show
              // the dots inside this exact bubble instead of a separate
              // "Thinking…" element — that separate element used to stay
              // mounted for the entire stream (isLoading only cleared on
              // completion), so the dots and the growing response text were
              // both visible at once. Tying the dots to "this bubble has no
              // content yet" instead of "a request is in flight" means
              // there's only ever one bubble in this position, and it can
              // never show both states at the same time.
              const showThinking =
                msg.role === 'assistant' && isLastBubble && isLoading && msg.content === '';

              return (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role !== 'user' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/10">
                      <Bot size={14} strokeWidth={1.5} className="text-ink" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-ink text-white'
                        : 'rounded-bl-sm border border-border-2 bg-card text-ink'
                    }`}
                  >
                    {showThinking ? (
                      <ThinkingDots />
                    ) : (
                      <MathContent
                        content={msg.content}
                        allowBlock={false}
                        className={`text-[14px] leading-relaxed [&_.math-para]:mb-0 [&_.math-para]:text-[14px] ${
                          msg.role === 'user' ? 'text-white [&_.math-para]:text-white' : 'text-ink'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border-2 bg-bg-1 px-4 py-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-green-600/20 transition-all">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              placeholder="Type your question..."
              className="flex-1 bg-transparent text-[14px] placeholder:text-faint focus:outline-none text-ink disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:bg-bg-2 disabled:text-faint"
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
