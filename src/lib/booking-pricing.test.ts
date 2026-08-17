import { describe, expect, it } from 'vitest';
import {
  PRE_CALL_BRIEF_ADDON_CENTS,
  computeBookingTotalCents,
  formatFifteenMinuteRate,
} from '@/lib/booking-pricing';

describe('computeBookingTotalCents', () => {
  it('charges only the mentor live session price for session_1on1 (pre-session briefing is always included as part of the standard session)', () => {
    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: false,
      }),
    ).toBe(32_000);

    // Flag is now ignored for live sessions (the optional paid add-on was removed; briefing is standard)
    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: true,
      }),
    ).toBe(32_000);
  });

  it('prorates live session price as hourly rate when durationMinutes provided (15min minimum, real-time slider)', () => {
    const hourly = 6000; // $60/hr = 1500 per 15min

    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: hourly,
        includePreCallBrief: false,
        durationMinutes: 15,
      }),
    ).toBe(1500);

    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: hourly,
        includePreCallBrief: false,
        durationMinutes: 30,
      }),
    ).toBe(3000);

    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: hourly,
        includePreCallBrief: false,
        durationMinutes: 60,
      }),
    ).toBe(6000);

    // Clamped to min 15
    expect(
      computeBookingTotalCents({
        serviceType: 'session_1on1',
        liveSessionPriceCents: hourly,
        includePreCallBrief: false,
        durationMinutes: 5,
      }),
    ).toBe(1500);
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

  it('formats the 15-minute marketplace rate from hourly cents', () => {
    expect(formatFifteenMinuteRate(6000)).toBe('$15 / 15 min');
    expect(formatFifteenMinuteRate(24_000)).toBe('$60 / 15 min');
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
