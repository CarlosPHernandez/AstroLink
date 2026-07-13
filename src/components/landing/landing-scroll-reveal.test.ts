import { describe, expect, it } from 'vitest';
import { computePinnedScrollProgress } from '@/components/landing/landing-scroll-reveal';

describe('computePinnedScrollProgress', () => {
  const viewport = 800;
  const section = 1680;
  const runway = section - viewport;

  it('stays at 0 before the section pins', () => {
    expect(computePinnedScrollProgress(420, section, viewport)).toBe(0);
  });

  it('ramps from 0 to 1 across the sticky runway', () => {
    expect(computePinnedScrollProgress(0, section, viewport)).toBe(0);
    expect(computePinnedScrollProgress(-runway / 2, section, viewport)).toBeCloseTo(0.5, 5);
    expect(computePinnedScrollProgress(-runway, section, viewport)).toBe(1);
  });

  it('clamps to 1 after the runway ends', () => {
    expect(computePinnedScrollProgress(-runway - 200, section, viewport)).toBe(1);
  });

  it('returns 1 when the section is shorter than the viewport', () => {
    expect(computePinnedScrollProgress(0, 600, viewport)).toBe(1);
  });
});