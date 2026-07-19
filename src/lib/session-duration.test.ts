import { describe, expect, it } from 'vitest';
import {
  clampSessionDurationMinutes,
  filledSegmentCount,
  formatUsdFromCents,
  SESSION_DURATION_DEFAULT,
} from './session-duration';

describe('session-duration', () => {
  it('clamps and steps to 15-minute increments', () => {
    expect(clampSessionDurationMinutes(7)).toBe(15);
    expect(clampSessionDurationMinutes(22)).toBe(15);
    expect(clampSessionDurationMinutes(30)).toBe(30);
    expect(clampSessionDurationMinutes(38)).toBe(45);
    expect(clampSessionDurationMinutes(99)).toBe(60);
  });

  it('maps duration to filled segments (3 per step)', () => {
    expect(filledSegmentCount(15)).toBe(3);
    expect(filledSegmentCount(30)).toBe(6);
    expect(filledSegmentCount(45)).toBe(9);
    expect(filledSegmentCount(60)).toBe(12);
    expect(filledSegmentCount(SESSION_DURATION_DEFAULT)).toBe(6);
  });

  it('formats cents as USD', () => {
    expect(formatUsdFromCents(15000)).toBe('$150');
    expect(formatUsdFromCents(15050)).toBe('$150.50');
  });
});
