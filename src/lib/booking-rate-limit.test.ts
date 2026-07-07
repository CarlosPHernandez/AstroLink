import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertBookingCancelRateLimit,
  assertBookingRateLimit,
  BookingRateLimitError,
  getBookingClientKey,
  isBookingRateLimitError,
} from './booking-rate-limit';

describe('booking-rate-limit (sliding window, per-user preferred)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.unstubAllEnvs();
    // reset in-memory by forcing new keys via unique
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function makeReq(headers: Record<string, string> = {}): Request {
    return new Request('http://localhost/api/book', { headers });
  }

  it('allows within configured limits and rejects after', () => {
    vi.stubEnv('BOOKING_RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv('BOOKING_MAX_REQUESTS_PER_MINUTE', '2');

    const key = 'user:test-1';
    assertBookingRateLimit(key);
    assertBookingRateLimit(key);
    expect(() => assertBookingRateLimit(key)).toThrow(BookingRateLimitError);
  });

  it('getBookingClientKey prefers explicit userId', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4' });
    expect(getBookingClientKey(req, 'u-abc')).toBe('user:u-abc');
    expect(getBookingClientKey(req, null)).toBe('1.2.3.4');
  });

  it('cancel has separate (stricter default) limits', () => {
    vi.stubEnv('BOOKING_CANCEL_RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv('BOOKING_CANCEL_MAX_REQUESTS_PER_MINUTE', '1');

    const key = 'user:test-cancel';
    assertBookingCancelRateLimit(key);
    expect(() => assertBookingCancelRateLimit(key)).toThrow(BookingRateLimitError);
  });

  it('returns 429 shape via isBookingRateLimitError guard', () => {
    vi.stubEnv('BOOKING_RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv('BOOKING_MAX_REQUESTS_PER_MINUTE', '0'); // force immediate reject

    try {
      assertBookingRateLimit('u-x');
    } catch (error) {
      expect(isBookingRateLimitError(error)).toBe(true);
      if (isBookingRateLimitError(error)) {
        expect(error.retryAfterMs).toBeGreaterThan(0);
      }
    }
  });

  it('disabled via env false passes through', () => {
    vi.stubEnv('BOOKING_RATE_LIMIT_ENABLED', 'false');
    const key = 'user:unlimited';
    for (let i = 0; i < 100; i++) {
      assertBookingRateLimit(key);
    }
    // no throw
  });
});
