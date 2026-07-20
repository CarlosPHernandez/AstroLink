import { describe, expect, it } from 'vitest';
import {
  getChrisBookingEntryHref,
  getChrisBookingPath,
} from '@/lib/chris-campaign/chris-booking-href';

describe('chris-booking-href', () => {
  it('builds booking path with mentor and campaign', () => {
    expect(getChrisBookingPath('chris-sembroski')).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris',
    );
  });

  it('returns booking path when signed in', () => {
    expect(getChrisBookingEntryHref('chris-sembroski', true)).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris',
    );
  });

  it('returns booking path for signed-out users (inline wizard auth)', () => {
    expect(getChrisBookingEntryHref('chris-sembroski', false)).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris',
    );
  });

  it('includes optional date query for landing prefill', () => {
    expect(getChrisBookingPath('chris-sembroski', { date: '2026-07-15' })).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris&date=2026-07-15',
    );
  });

  it('includes optional ref query for marketing attribution', () => {
    expect(
      getChrisBookingPath('chris-sembroski', { ref: 'chris-sembroski', date: '2026-07-15' }),
    ).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris&date=2026-07-15&ref=chris-sembroski',
    );
  });

  it('includes clamped duration for landing prefill', () => {
    expect(
      getChrisBookingPath('chris-sembroski', { durationMinutes: 30, date: '2026-07-22' }),
    ).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris&date=2026-07-22&duration=30',
    );
    expect(getChrisBookingPath('chris-sembroski', { durationMinutes: 7 })).toBe(
      '/booking?mentor=chris-sembroski&campaign=chris&duration=15',
    );
  });
});