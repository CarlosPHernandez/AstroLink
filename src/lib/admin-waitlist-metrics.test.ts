import { describe, expect, it } from 'vitest';

function computeWowPercent(last7d: number, prev7d: number): number | null {
  if (prev7d === 0) {
    return last7d === 0 ? 0 : null;
  }
  return Math.round(((last7d - prev7d) / prev7d) * 1000) / 10;
}

describe('waitlist WoW percent', () => {
  it('returns 0 when both windows are empty', () => {
    expect(computeWowPercent(0, 0)).toBe(0);
  });

  it('returns null when prior window is zero but current has signups', () => {
    expect(computeWowPercent(5, 0)).toBeNull();
  });

  it('computes positive growth', () => {
    expect(computeWowPercent(15, 10)).toBe(50);
  });
});
