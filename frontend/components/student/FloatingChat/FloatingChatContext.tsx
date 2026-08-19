'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface OpenChatOptions {
  /** Topic to scope the conversation to. Omit for the general tutor chat. */
  topicId?: string;
  /** If provided, sent as the opening message automatically (e.g. the
   * "why is this wrong?" hook on a missed practice question) instead of
   * waiting for the student to type something. */
  seedMessage?: string;
}

interface FloatingChatContextValue {
  isOpen: boolean;
  topicId: string | undefined;
  pendingSeedMessage: string | undefined;
  openChat: (options?: OpenChatOptions) => void;
  closeChat: () => void;
  consumeSeedMessage: () => void;
  isSuppressed: boolean;
  setSuppressed: (suppressed: boolean) => void;
}

const FloatingChatContext = createContext<FloatingChatContextValue | null>(null);

export function useFloatingChat(): FloatingChatContextValue {
  const ctx = useContext(FloatingChatContext);
  if (!ctx) {
    throw new Error('useFloatingChat must be used within a FloatingChatProvider');
  }
  return ctx;
}

/**
 * Mounted once in the (student) layout. Not gated behind any step or
 * topic completion — available immediately on every student-facing page.
 * Keep + add: this is separate from the existing per-topic Step 5 chat,
 * which is untouched.
 */
export function FloatingChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicId, setTopicId] = useState<string | undefined>(undefined);
  const [pendingSeedMessage, setPendingSeedMessage] = useState<string | undefined>(undefined);
  const [isSuppressed, setIsSuppressed] = useState(false);

  const openChat = useCallback((options?: OpenChatOptions) => {
    setTopicId(options?.topicId);
    setPendingSeedMessage(options?.seedMessage);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  const consumeSeedMessage = useCallback(() => setPendingSeedMessage(undefined), []);

  const setSuppressed = useCallback((suppressed: boolean) => {
    setIsSuppressed(suppressed);
  }, []);

  return (
    <FloatingChatContext.Provider
      value={{
        isOpen,
        topicId,
        pendingSeedMessage,
        openChat,
        closeChat,
        consumeSeedMessage,
        isSuppressed,
        setSuppressed,
      }}
    >
      {children}
    </FloatingChatContext.Provider>
  );
}
