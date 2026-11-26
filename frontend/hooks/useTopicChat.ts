'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChatError,
  clearChatHistory,
  getCachedChatHistory,
  getChatHistory,
  sendChatMessageStream,
  setCachedChatHistory,
  type ChatMessage,
} from '@/lib/api/chat';
import { useSmartChatScroll } from '@/hooks/useSmoothedStream';
import { toast } from '@/lib/toast';

export interface UseTopicChatOptions {
  topicId?: string;
  initialMessages?: ChatMessage[];
  /** When true, failed stream errors write an inline assistant fallback instead of pruning the bubble. */
  inlineErrorFallback?: boolean;
}

export function useTopicChat({
  topicId,
  initialMessages = [],
  inlineErrorFallback = false,
}: UseTopicChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = getCachedChatHistory(topicId);
    if (cached && cached.length > 0) return cached;
    return initialMessages;
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useSmartChatScroll();
  const { pinToBottom, followIfPinned } = scroll;

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  // Re-sync cached + remote history whenever topicId changes
  useEffect(() => {
    let isCurrent = true;
    const cached = getCachedChatHistory(topicId);
    if (cached && cached.length > 0) {
      setMessages(cached);
    }

    getChatHistory(topicId)
      .then((history) => {
        if (!isCurrent) return;
        if (history && history.length > 0) {
          setMessages(history);
          setCachedChatHistory(topicId, history);
        }
      })
      .catch(() => {
        // Retain cached or initial messages silently
      });

    return () => {
      isCurrent = false;
    };
  }, [topicId]);

  useEffect(() => {
    followIfPinned();
  }, [messages.length, followIfPinned]);

  const recordQuizOutcome = useCallback((correct: boolean) => {
    setQuizScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, []);

  const handleClearClick = useCallback(() => {
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
        setQuizScore({ correct: 0, total: 0 });
        setCachedChatHistory(topicId, []);
      })
      .catch(() => toast.error('Could not clear chat', 'Please try again.'))
      .finally(() => setIsClearing(false));
  }, [confirmingClear, topicId]);

  const submitMessage = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isLoading) return;
      setIsLoading(true);

      setMessages((prev) => {
        const next: ChatMessage[] = [
          ...prev,
          { role: 'user', content: trimmed },
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
          trimmed,
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
            if (inlineErrorFallback) {
              setMessages((prev) => {
                if (prev.length === 0) return prev;
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (next[lastIdx]?.role === 'assistant') {
                  next[lastIdx] = {
                    ...next[lastIdx],
                    content:
                      responseAccumulator ||
                      err?.message ||
                      "Sorry, I couldn't reach the AI tutor. Please try again.",
                  };
                }
                setCachedChatHistory(topicId, next);
                return next;
              });
              return;
            }

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
              toast.error(
                'Message failed to send',
                err?.message || 'Check your connection and try again.',
              );
            }
          },
        );
      } catch {
        setIsLoading(false);
      }
    },
    [inlineErrorFallback, isLoading, pinToBottom, topicId],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const query = inputMessage.trim();
      if (!query || isLoading) return;
      setInputMessage('');
      void submitMessage(query);
    },
    [inputMessage, isLoading, submitMessage],
  );

  return {
    messages,
    setMessages,
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
    ...scroll,
  };
}
