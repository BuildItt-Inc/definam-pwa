import { getAuthHeaders } from './auth';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getChatHistory(topicId: string): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/history?topic_id=${topicId}`,
    {
      headers,
    }
  );
  if (!res.ok) {
    throw new Error('Failed to load chat history');
  }
  return res.json();
}

export async function sendChatMessageStream(
  topicId: string,
  question: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/stream?topic_id=${topicId}&question=${encodeURIComponent(question)}`;
    
    const res = await fetch(url, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Chat stream error: ${res.statusText}`);
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
