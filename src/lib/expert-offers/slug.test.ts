import { describe, expect, it } from 'vitest';
import { nextOfferSlug, slugifyOfferTitle } from '@/lib/expert-offers/slug';

describe('slugifyOfferTitle', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyOfferTitle('Book Lessons and How to Apply Them')).toBe(
      'book-lessons-and-how-to-apply-them',
    );
  });

  it('collapses punctuation and spaces', () => {
    expect(slugifyOfferTitle('Thesis / dissertation review')).toBe(
      'thesis-dissertation-review',
    );
  });

  it('falls back to offer when empty', () => {
    expect(slugifyOfferTitle('!!!')).toBe('offer');
  });
});

describe('nextOfferSlug', () => {
  it('returns the base when free', () => {
    expect(nextOfferSlug('strategy-call', [])).toBe('strategy-call');
  });

  it('suffixes -2 then -3 on collision', () => {
    expect(nextOfferSlug('strategy-call', ['strategy-call'])).toBe('strategy-call-2');
    expect(nextOfferSlug('strategy-call', ['strategy-call', 'strategy-call-2'])).toBe(
      'strategy-call-3',
    );
  });
});
