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

// topicId omitted (or undefined) -> the general floating-chat history
// (topic_id IS NULL server-side), separate from any topic's own history.
export async function getChatHistory(topicId?: string): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();
  const query = topicId ? `?topic_id=${topicId}` : '';
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/history${query}`,
    {
      headers,
    }
  );
  if (!res.ok) {
    throw new Error('Failed to load chat history');
  }
  return res.json();
}

// Clears the same conversation getChatHistory(topicId) would return —
// the general floating-chat history when topicId is omitted, or that
// specific topic's history when provided.
export async function clearChatHistory(topicId?: string): Promise<void> {
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
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ question });
    if (topicId) params.set('topic_id', topicId);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/stream?${params.toString()}`;

    const res = await fetch(url, {
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: '' }));
      throw new ChatError(
        res.status,
        body.detail || `Chat stream error: ${res.statusText}`,
      );
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
            if (parsed && parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch {
            // Ignore parse errors on half-received frames
          }
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
