import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetEducatorDemoRateLimitForTests,
  assertEducatorDemoSubmitRateLimit,
  getEducatorDemoClientIp,
  isEducatorDemoRateLimitError,
} from '@/lib/educators/rate-limit';

describe('educator demo rate limit', () => {
  afterEach(() => {
    __resetEducatorDemoRateLimitForTests();
    delete process.env.EDUCATOR_DEMO_RATE_LIMIT_ENABLED;
    delete process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE;
    delete process.env.EDUCATOR_DEMO_MAX_PER_EMAIL_HOUR;
    delete process.env.EDUCATOR_DEMO_MAX_GLOBAL_MINUTE;
  });

  it('allows under the limit', () => {
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = '5';
    expect(() =>
      assertEducatorDemoSubmitRateLimit('1.2.3.4', 'a@school.edu'),
    ).not.toThrow();
  });

  it('throws when IP minute limit exceeded', () => {
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = '1';
    assertEducatorDemoSubmitRateLimit('9.9.9.9', 'a@school.edu');
    try {
      assertEducatorDemoSubmitRateLimit('9.9.9.9', 'b@school.edu');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(isEducatorDemoRateLimitError(error)).toBe(true);
    }
  });

  it('throws when email hour limit exceeded', () => {
    process.env.EDUCATOR_DEMO_MAX_PER_EMAIL_HOUR = '1';
    assertEducatorDemoSubmitRateLimit('1.1.1.1', 'same@school.edu');
    try {
      assertEducatorDemoSubmitRateLimit('2.2.2.2', 'same@school.edu');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(isEducatorDemoRateLimitError(error)).toBe(true);
    }
  });

  it('can be disabled', () => {
    process.env.EDUCATOR_DEMO_RATE_LIMIT_ENABLED = 'false';
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = '1';
    assertEducatorDemoSubmitRateLimit('1.1.1.1', 'a@school.edu');
    expect(() =>
      assertEducatorDemoSubmitRateLimit('1.1.1.1', 'a@school.edu'),
    ).not.toThrow();
  });

  it('treats EDUCATOR_DEMO_RATE_LIMIT_ENABLED=0 as disabled', () => {
    process.env.EDUCATOR_DEMO_RATE_LIMIT_ENABLED = '0';
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = '1';
    assertEducatorDemoSubmitRateLimit('3.3.3.3', 'a@school.edu');
    expect(() =>
      assertEducatorDemoSubmitRateLimit('3.3.3.3', 'a@school.edu'),
    ).not.toThrow();
  });

  it('throws when global minute limit exceeded across IPs', () => {
    process.env.EDUCATOR_DEMO_MAX_GLOBAL_MINUTE = '1';
    assertEducatorDemoSubmitRateLimit('1.1.1.1', 'a@school.edu');
    try {
      assertEducatorDemoSubmitRateLimit('2.2.2.2', 'b@school.edu');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(isEducatorDemoRateLimitError(error)).toBe(true);
    }
  });

  it('falls back to default IP window when env is invalid', () => {
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = 'not-a-number';
    expect(() =>
      assertEducatorDemoSubmitRateLimit('8.8.8.8', 'a@school.edu'),
    ).not.toThrow();
  });

  it('reads client IP from x-forwarded-for, then x-real-ip, else unknown', () => {
    expect(
      getEducatorDemoClientIp(
        new Request('http://localhost', { headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' } }),
      ),
    ).toBe('203.0.113.1');
    expect(
      getEducatorDemoClientIp(
        new Request('http://localhost', {
          headers: { 'x-forwarded-for': '  , 10.0.0.1', 'x-real-ip': '198.51.100.9' },
        }),
      ),
    ).toBe('198.51.100.9');
    expect(
      getEducatorDemoClientIp(
        new Request('http://localhost', { headers: { 'x-real-ip': '198.51.100.9' } }),
      ),
    ).toBe('198.51.100.9');
    expect(getEducatorDemoClientIp(new Request('http://localhost'))).toBe('unknown');
  });
});
