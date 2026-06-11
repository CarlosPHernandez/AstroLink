import { createHash } from 'node:crypto';

import { GLOSSARY_VERSION } from '@/lib/transcript-translation/glossary';
import type { SupportedTargetLocale } from '@/lib/transcript-translation/types';

const DEFAULT_MAX_ENTRIES = 500;

export function hashSegmentText(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex').slice(0, 16);
}

export function buildSegmentCacheKey(params: {
  bookingId: string;
  text: string;
  sourceLocale: string;
  targetLocale: SupportedTargetLocale;
  glossaryVersion?: number;
}): string {
  const glossaryVersion = params.glossaryVersion ?? GLOSSARY_VERSION;
  const textHash = hashSegmentText(params.text);
  const source = params.sourceLocale.trim() || 'en';
  return `${params.bookingId}:${textHash}:${source}:${params.targetLocale}:g${glossaryVersion}`;
}

type CacheEntry = {
  translatedText: string;
};

/**
 * In-memory LRU segment translation cache (E7).
 * One cache instance per booking session on the server.
 */
export class SegmentTranslationCache {
  private readonly maxEntries: number;
  private readonly store = new Map<string, CacheEntry>();

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    // LRU touch: delete + re-insert
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.translatedText;
  }

  set(key: string, translatedText: string): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { translatedText });
    this.evictIfNeeded();
  }

  private evictIfNeeded(): void {
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.store.delete(oldest);
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

const cachesByBooking = new Map<string, SegmentTranslationCache>();

export function getSegmentCacheForBooking(bookingId: string): SegmentTranslationCache {
  let cache = cachesByBooking.get(bookingId);
  if (!cache) {
    cache = new SegmentTranslationCache();
    cachesByBooking.set(bookingId, cache);
  }
  return cache;
}

/** Test helper — reset all booking caches. */
export function clearAllSegmentCaches(): void {
  cachesByBooking.clear();
}
