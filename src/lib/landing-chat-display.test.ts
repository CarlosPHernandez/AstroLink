import { describe, expect, it } from 'vitest';
import { formatChatWords, splitChatWords } from '@/lib/landing-chat-display';

describe('landing-chat-display (re-export)', () => {
  it('splits and formats words', () => {
    expect(splitChatWords('a b')).toEqual(['a', 'b']);
    expect(formatChatWords(['a', 'b'], 1)).toBe('a');
  });
});
