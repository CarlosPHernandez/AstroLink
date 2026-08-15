import { describe, expect, it } from 'vitest';
import {
  applySettlementPolicy,
  buildSettlementPrompt,
  isSettlementDecision,
} from './session-settlement';

describe('applySettlementPolicy', () => {
  it('marks completed sessions payout-eligible without a refund queue', () => {
    expect(applySettlementPolicy('completed')).toEqual({
      payoutEligible: true,
      refundRecommended: false,
    });
  });

  it('does not auto-pay the expert on a no-show or short call', () => {
    expect(applySettlementPolicy('no_show_expert').payoutEligible).toBe(false);
    expect(applySettlementPolicy('no_show_expert').refundRecommended).toBe(true);
    expect(applySettlementPolicy('too_short').refundRecommended).toBe(true);
  });

  it('holds disputes without refunding automatically', () => {
    expect(applySettlementPolicy('dispute_hold')).toEqual({
      payoutEligible: false,
      refundRecommended: false,
    });
  });
});

describe('isSettlementDecision', () => {
  it('accepts only the five settlement decisions', () => {
    expect(isSettlementDecision('completed')).toBe(true);
    expect(isSettlementDecision('refund_now')).toBe(false);
  });
});

describe('buildSettlementPrompt', () => {
  it('includes telemetry and forbids inventing transcript content', () => {
    const prompt = buildSettlementPrompt({
      bookedDurationMinutes: 45,
      actualDurationMinutes: 2,
      menteeJoined: true,
      mentorJoined: false,
      transcriptAvailable: false,
      utteranceCount: 0,
      amountCents: 14400,
    });
    expect(prompt).toContain('Actual duration minutes: 2');
    expect(prompt).toContain('Do not invent what was said');
  });
});
