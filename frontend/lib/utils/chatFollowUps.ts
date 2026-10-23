import type { ChatMessage } from '@/lib/api/chat';

/**
 * Generates natural, thoughtful follow-up questions based on the conversation context.
 * Matches the reference design in the mobile chat mockup:
 * - "Give me a practice question"
 * - "Explain it again, simpler"
 */
export function getFollowUpSuggestions(
  messages: ChatMessage[],
  topicTitle?: string
): string[] {
  if (!messages || messages.length === 0) {
    return [
      topicTitle ? `Give me a quick summary of ${topicTitle}` : 'Explain this topic in simple terms',
      'Give me a practice question',
    ];
  }

  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== 'assistant' || !lastMsg.content.trim()) {
    return [];
  }

  const content = lastMsg.content.toLowerCase();

  // If assistant asked the student a question or gave a problem to solve
  if (
    content.includes('can you solve') ||
    content.includes('try solving') ||
    (content.includes('?') && (content.includes('what do you think') || content.includes('try this')))
  ) {
    return [
      'Can you give me a hint?',
      'Walk me through the first step',
    ];
  }

  // If the explanation contains a formula or numbers
  if (content.includes('=') || content.includes('formula') || content.includes('step') || content.includes('base')) {
    return [
      'Give me a practice question',
      'Explain it again, simpler',
    ];
  }

  // Standard thoughtful suggestions
  return [
    'Give me a practice question',
    'Explain it again, simpler',
  ];
}
