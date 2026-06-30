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

  it('wraps booking path in auth redirect when signed out', () => {
    expect(getChrisBookingEntryHref('chris-sembroski', false)).toBe(
      '/auth?redirect=%2Fbooking%3Fmentor%3Dchris-sembroski%26campaign%3Dchris',
    );
  });
});