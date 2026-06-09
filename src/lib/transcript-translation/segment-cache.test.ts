import { describe, expect, it, beforeEach } from 'vitest';

import {
  SegmentTranslationCache,
  buildSegmentCacheKey,
  clearAllSegmentCaches,
  getSegmentCacheForBooking,
} from '@/lib/transcript-translation/segment-cache';

describe('SegmentTranslationCache', () => {
  let cache: SegmentTranslationCache;

  beforeEach(() => {
    clearAllSegmentCaches();
    cache = new SegmentTranslationCache(2);
  });

  it('stores and retrieves translated text', () => {
    const key = buildSegmentCacheKey({
      bookingId: 'booking-1',
      text: 'Hello',
      targetLocale: 'es',
    });
    cache.set(key, 'Hola');
    expect(cache.get(key)).toBe('Hola');
  });

  it('evicts oldest entry when over capacity', () => {
    const k1 = buildSegmentCacheKey({ bookingId: 'b', text: 'one', targetLocale: 'es' });
    const k2 = buildSegmentCacheKey({ bookingId: 'b', text: 'two', targetLocale: 'es' });
    const k3 = buildSegmentCacheKey({ bookingId: 'b', text: 'three', targetLocale: 'es' });

    cache.set(k1, 'uno');
    cache.set(k2, 'dos');
    cache.set(k3, 'tres');

    expect(cache.get(k1)).toBeNull();
    expect(cache.get(k2)).toBe('dos');
    expect(cache.get(k3)).toBe('tres');
  });

  it('scopes caches per booking id', () => {
    const bookingA = getSegmentCacheForBooking('a');
    const bookingB = getSegmentCacheForBooking('b');
    const key = buildSegmentCacheKey({ bookingId: 'ignored', text: 'x', targetLocale: 'fr' });

    bookingA.set(key, 'fr-a');
    bookingB.set(key, 'fr-b');

    expect(bookingA.get(key)).toBe('fr-a');
    expect(bookingB.get(key)).toBe('fr-b');
  });

  it('includes glossary version in cache key', () => {
    const base = buildSegmentCacheKey({
      bookingId: 'b',
      text: 'LEO',
      targetLocale: 'ja',
      glossaryVersion: 1,
    });
    const bumped = buildSegmentCacheKey({
      bookingId: 'b',
      text: 'LEO',
      targetLocale: 'ja',
      glossaryVersion: 2,
    });
    expect(base).not.toBe(bumped);
  });
});
