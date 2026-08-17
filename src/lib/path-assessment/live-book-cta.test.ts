import { describe, expect, it } from 'vitest';
import { liveBookCtaCopy } from './live-book-cta';

describe('liveBookCtaCopy', () => {
  it('uses the matched expert name when Gemini recommended one', () => {
    expect(liveBookCtaCopy('Chris Sembroski')).toEqual({
      mobile: 'Book Chris',
      desktop: 'Book Chris Sembroski',
    });
  });

  it('does not invent a name when there is no match', () => {
    expect(liveBookCtaCopy(null)).toEqual({
      mobile: 'Book a live session',
      desktop: 'Book a live session — Gemini matches you',
    });
  });

  it('treats blank names as unmatched', () => {
    expect(liveBookCtaCopy('   ')).toEqual({
      mobile: 'Book a live session',
      desktop: 'Book a live session — Gemini matches you',
    });
  });

  it('uses the same token for mobile and desktop when there is only one name', () => {
    expect(liveBookCtaCopy('Ada')).toEqual({
      mobile: 'Book Ada',
      desktop: 'Book Ada',
    });
  });
});
