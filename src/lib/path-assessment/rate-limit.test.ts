import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetPathAssessmentRateLimitForTests,
  assertPathAssessmentSubmitRateLimit,
  isPathAssessmentRateLimitError,
} from '@/lib/path-assessment/rate-limit';

describe('path assessment rate limit', () => {
  afterEach(() => {
    __resetPathAssessmentRateLimitForTests();
    delete process.env.PATH_ASSESSMENT_RATE_LIMIT_ENABLED;
    delete process.env.PATH_ASSESSMENT_MAX_PER_IP_MINUTE;
  });

  it('allows under the limit', () => {
    process.env.PATH_ASSESSMENT_MAX_PER_IP_MINUTE = '5';
    expect(() =>
      assertPathAssessmentSubmitRateLimit('1.2.3.4', 'a@example.com'),
    ).not.toThrow();
  });

  it('throws when IP minute limit exceeded', () => {
    process.env.PATH_ASSESSMENT_MAX_PER_IP_MINUTE = '1';
    assertPathAssessmentSubmitRateLimit('9.9.9.9', 'a@example.com');
    try {
      assertPathAssessmentSubmitRateLimit('9.9.9.9', 'b@example.com');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(isPathAssessmentRateLimitError(error)).toBe(true);
    }
  });

  it('can be disabled', () => {
    process.env.PATH_ASSESSMENT_RATE_LIMIT_ENABLED = 'false';
    process.env.PATH_ASSESSMENT_MAX_PER_IP_MINUTE = '1';
    assertPathAssessmentSubmitRateLimit('1.1.1.1', 'a@example.com');
    expect(() =>
      assertPathAssessmentSubmitRateLimit('1.1.1.1', 'a@example.com'),
    ).not.toThrow();
  });
});
