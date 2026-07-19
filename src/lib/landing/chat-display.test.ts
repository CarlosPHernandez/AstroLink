import { describe, expect, it } from 'vitest';
import { formatChatWords, splitChatWords } from '@/lib/landing/chat-display';

describe('landing chat display', () => {
  it('splits words for typewriter', () => {
    expect(splitChatWords('  hello   world ')).toEqual(['hello', 'world']);
  });

  it('formats visible word prefix', () => {
    const words = splitChatWords('one two three');
    expect(formatChatWords(words, 0)).toBe('');
    expect(formatChatWords(words, 2)).toBe('one two');
  });
});
