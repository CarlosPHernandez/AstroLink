import { describe, expect, it } from 'vitest';
import { hashLlmPrompt, summarizeLlmOutput } from '@/lib/llm-audit';

describe('hashLlmPrompt', () => {
  it('returns stable sha256 hex for the same inputs', () => {
    const a = hashLlmPrompt('system', 'prompt');
    const b = hashLlmPrompt('system', 'prompt');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when prompt changes', () => {
    expect(hashLlmPrompt('system', 'a')).not.toBe(hashLlmPrompt('system', 'b'));
  });
});

describe('summarizeLlmOutput', () => {
  it('prefers one_line_summary from structured output', () => {
    expect(
      summarizeLlmOutput({
        one_line_summary: 'Buyer ready for payload integration deep-dive.',
      }),
    ).toBe('Buyer ready for payload integration deep-dive.');
  });

  it('truncates long plain text', () => {
    const long = 'x'.repeat(400);
    const summary = summarizeLlmOutput(long);
    expect(summary.length).toBeLessThanOrEqual(280);
    expect(summary.endsWith('...')).toBe(true);
  });
});