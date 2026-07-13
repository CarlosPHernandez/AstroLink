import { describe, expect, it } from 'vitest';
import { formatChatWords, splitChatWords } from '@/lib/landing-chat-display';

describe('landing-chat-display', () => {
  it('splits and formats words for typing display', () => {
    const words = splitChatWords('A verified expert can help.');
    expect(words).toEqual(['A', 'verified', 'expert', 'can', 'help.']);
    expect(formatChatWords(words, 2)).toBe('A verified');
    expect(formatChatWords(words, words.length)).toBe('A verified expert can help.');
  });
});