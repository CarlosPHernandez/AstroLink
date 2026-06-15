import { describe, expect, it } from 'vitest';
import { computeCancellationRefund, isEligibleForFullRefund } from './refunds';

describe('refunds policy (immediate capture launch)', () => {
  it('grants full refund when >=24h before scheduled time', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const scheduled = new Date('2026-06-11T12:00:00Z'); // ~26h
    const decision = computeCancellationRefund(scheduled, now);
    expect(decision.refundable).toBe(true);
    expect(decision.refundPercent).toBe(100);
    expect(decision.reason).toMatch(/24h/);
  });

  it('denies refund when within 24h window', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const scheduled = new Date('2026-06-10T20:00:00Z'); // 10h
    const decision = computeCancellationRefund(scheduled, now);
    expect(decision.refundable).toBe(false);
    expect(decision.refundPercent).toBe(0);
    expect(decision.reason).toMatch(/within 24h/);
  });

  it('handles exactly 24h boundary as refundable', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const scheduled = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const decision = computeCancellationRefund(scheduled, now);
    expect(decision.refundable).toBe(true);
  });

  it('isEligibleForFullRefund convenience matches', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const far = new Date('2026-06-12T10:00:00Z');
    const near = new Date('2026-06-10T11:00:00Z');
    expect(isEligibleForFullRefund(far, now)).toBe(true);
    expect(isEligibleForFullRefund(near, now)).toBe(false);
  });

  it('returns non-refundable for invalid date', () => {
    const decision = computeCancellationRefund('not-a-date');
    expect(decision.refundable).toBe(false);
    expect(decision.reason).toMatch(/Invalid/);
  });
});
