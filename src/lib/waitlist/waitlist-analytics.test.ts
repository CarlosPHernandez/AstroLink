import { describe, expect, it } from 'vitest';
import { dwellBucket, sanitizeWaitlistRef } from './waitlist-analytics';

describe('dwellBucket', () => {
  it('maps dwell time to buckets', () => {
    expect(dwellBucket(0)).toBe('0-10s');
    expect(dwellBucket(9_999)).toBe('0-10s');
    expect(dwellBucket(10_000)).toBe('10-30s');
    expect(dwellBucket(29_999)).toBe('10-30s');
    expect(dwellBucket(30_000)).toBe('30-60s');
    expect(dwellBucket(59_999)).toBe('30-60s');
    expect(dwellBucket(60_000)).toBe('60-120s');
    expect(dwellBucket(119_999)).toBe('60-120s');
    expect(dwellBucket(120_000)).toBe('120s+');
    expect(dwellBucket(600_000)).toBe('120s+');
  });

  it('clamps negative values to 0-10s', () => {
    expect(dwellBucket(-1)).toBe('0-10s');
  });
});

describe('sanitizeWaitlistRef', () => {
  it('returns direct for empty values', () => {
    expect(sanitizeWaitlistRef(undefined)).toBe('direct');
    expect(sanitizeWaitlistRef('')).toBe('direct');
    expect(sanitizeWaitlistRef('   ')).toBe('direct');
  });

  it('trims and truncates long refs', () => {
    expect(sanitizeWaitlistRef('  linkedin-jun-2026  ')).toBe('linkedin-jun-2026');
    expect(sanitizeWaitlistRef('a'.repeat(300)).length).toBe(255);
  });
});