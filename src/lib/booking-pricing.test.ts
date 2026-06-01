import { describe, expect, it } from 'vitest';
import {
  PRE_CALL_BRIEF_ADDON_CENTS,
  computeBookingTotalCents,
} from '@/lib/booking-pricing';

describe('computeBookingTotalCents', () => {
  it('charges live session price for session_1on1 without add-on', () => {
    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: false,
      }),
    ).toBe(32_000);
  });

  it('adds pre-call brief add-on when requested with live session', () => {
    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: true,
      }),
    ).toBe(32_000 + PRE_CALL_BRIEF_ADDON_CENTS);
  });

  it('uses fixed price for pre_call_brief-only SKU', () => {
    expect(
      computeBookingTotalCents({
        serviceType: 'pre_call_brief',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: false,
      }),
    ).toBe(PRE_CALL_BRIEF_ADDON_CENTS);
  });

  it('rejects extended_session in D1', () => {
    expect(() =>
      computeBookingTotalCents({
        serviceType: 'extended_session',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: false,
      }),
    ).toThrow(/not available in D1/);
  });
});
