import { getAuthHeaders } from './auth';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// In-memory instant cache per topic (or '__global__' for general floating chat)
const historyCache = new Map<string, ChatMessage[]>();

export function getCachedChatHistory(topicId?: string): ChatMessage[] | null {
  return historyCache.get(topicId || '__global__') || null;
}

export function setCachedChatHistory(topicId: string | undefined, messages: ChatMessage[]): void {
  historyCache.set(topicId || '__global__', messages);
}

// topicId omitted (or undefined) -> the general floating-chat history
// (topic_id IS NULL server-side), separate from any topic's own history.
export async function getChatHistory(topicId?: string): Promise<ChatMessage[]> {
  try {
    const headers = await getAuthHeaders();
    const query = topicId ? `?topic_id=${topicId}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/history${query}`,
      {
        headers,
      }
    );
    if (!res.ok) {
      return historyCache.get(topicId || '__global__') || [];
    }
    const data: ChatMessage[] = await res.json();
    historyCache.set(topicId || '__global__', data);
    return data;
  } catch {
    return historyCache.get(topicId || '__global__') || [];
  }
}

// Clears the same conversation getChatHistory(topicId) would return —
// the general floating-chat history when topicId is omitted, or that
// specific topic's history when provided.
export async function clearChatHistory(topicId?: string): Promise<void> {
  historyCache.delete(topicId || '__global__');
  const headers = await getAuthHeaders();
  const query = topicId ? `?topic_id=${topicId}` : '';
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/history${query}`,
    {
      method: 'DELETE',
      headers,
    }
  );
  if (!res.ok) {
    throw new Error('Failed to clear chat history');
  }
}

export async function sendChatMessageStream(
  topicId: string | undefined,
  question: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  try {
    const authHeaders = await getAuthHeaders();
    // For SSE stream GET requests, do NOT send Content-Type: application/json.
    // Instead, specify Accept: text/event-stream so proxies stream without buffering.
    const streamHeaders: Record<string, string> = {
      Accept: 'text/event-stream',
    };
    if (typeof authHeaders === 'object' && authHeaders !== null) {
      for (const [key, val] of Object.entries(authHeaders)) {
        if (key.toLowerCase() !== 'content-type') {
          streamHeaders[key] = val as string;
        }
      }
    }

    const params = new URLSearchParams({ question });
    if (topicId) params.set('topic_id', topicId);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/stream?${params.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: streamHeaders,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: '' }));
      const detail = body.detail || '';
      let userFriendlyMessage = detail;
      if (res.status >= 500) {
        userFriendlyMessage = detail || 'The AI tutor server is temporarily busy or reconnecting. Please try again shortly.';
      } else if (res.status === 429) {
        userFriendlyMessage = detail || 'Daily AI tutor message limit reached. Please check back tomorrow.';
      }
      throw new ChatError(res.status, userFriendlyMessage);
    }

    if (!res.body) {
      throw new Error('No stream body returned');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Save last line fragment if it's incomplete
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed && typeof parsed.chunk === 'string') {
              onChunk(parsed.chunk);
            }
          } catch {
            // Ignore parse errors on half-received frames
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
