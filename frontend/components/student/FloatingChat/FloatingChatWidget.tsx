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
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-xl transition-transform active:scale-95 md:bottom-6"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-end sm:justify-end sm:bg-transparent sm:p-6">
      <div className="page-enter flex h-[min(85vh,640px)] w-full max-w-md flex-col rounded-t-2xl border border-border-2 bg-card shadow-2xl sm:h-[560px] sm:rounded-2xl">
        {/* Header */}
        <header className="flex items-center gap-3 rounded-t-2xl border-b border-border bg-card px-4 py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink/10">
            <Bot size={18} strokeWidth={1.5} className="text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] text-ink">AI Tutor</p>
            <p className="truncate text-[12px] text-muted">
              {topicId ? 'Chatting about this topic' : 'General study help'}
            </p>
          </div>
          {messages.length > 0 &&
            (confirmingClear ? (
              <button
                type="button"
                onClick={handleClearClick}
                disabled={isClearing}
                className="flex-shrink-0 whitespace-nowrap rounded-md bg-danger/10 px-2 py-1 text-[11px] font-bold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
              >
                Clear chat?
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearClick}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="flex-shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-bg-1 hover:text-danger"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            ))}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex-shrink-0 rounded-full p-1.5 text-muted hover:bg-bg-1 hover:text-ink transition-colors"
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
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role !== 'user' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/10">
                    <Bot size={14} strokeWidth={1.5} className="text-ink" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-ink text-white'
                      : 'rounded-tl-sm bg-bg-2 text-ink'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/10">
                <Bot size={14} strokeWidth={1.5} className="text-ink" />
              </div>
              <div className="max-w-[80%] animate-pulse rounded-2xl rounded-tl-sm bg-bg-2 px-3.5 py-2.5 text-[14px] text-ink/60">
                Thinking…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border-2 bg-bg-0 px-3 py-2.5 focus-within:border-brand transition-colors">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              placeholder="Type your question..."
              className="flex-1 bg-transparent text-[14px] placeholder:text-gray-400 focus:outline-none text-ink disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="flex-shrink-0 text-brand disabled:text-gray-300 hover:opacity-80 transition-opacity"
              aria-label="Send message"
            >
              <Send size={18} strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
