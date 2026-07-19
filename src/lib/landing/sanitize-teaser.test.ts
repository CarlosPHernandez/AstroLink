import { describe, expect, it } from 'vitest';
import {
  sanitizeLandingTeaser,
  takeLandingRelayChatMessages,
  truncateAtWordBoundary,
} from '@/lib/landing/sanitize-teaser';

describe('sanitizeLandingTeaser', () => {
  it('keeps the longer complete copy when the model repeats itself', () => {
    const short =
      'Have you ever wondered how scuba diving skills can enhance an astronaut\'s training? Explore the unique intersections of these two fields and discover what to consider when getting started in';
    const full = `${short} scuba!`;
    expect(sanitizeLandingTeaser(`${short}\n${full}`)).toBe(
      truncateAtWordBoundary(full, 200),
    );
    expect(sanitizeLandingTeaser(`${short}${full}`)).toContain('scuba');
    expect(sanitizeLandingTeaser(`${short}${full}`)).not.toMatch(
      /getting started in Have you ever/i,
    );
  });

  it('truncates on a word boundary', () => {
    const long = 'word '.repeat(80).trim();
    const out = truncateAtWordBoundary(long, 40);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(42);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe('takeLandingRelayChatMessages', () => {
  it('keeps only user + first expert bubble', () => {
    const messages = takeLandingRelayChatMessages([
      { role: 'user' as const, text: 'Hello' },
      { role: 'expert' as const, text: 'First teaser about your goal here.' },
      { role: 'expert' as const, text: 'Continue with booking please.' },
    ]);
    expect(messages).toHaveLength(2);
    expect(messages[1].text).toMatch(/First teaser/i);
  });
});
