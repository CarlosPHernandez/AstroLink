import { describe, expect, it } from 'vitest';
import { formatOfferBookingLabel } from '@/lib/expert-offers/label';

describe('formatOfferBookingLabel', () => {
  it('prefers the snapshot title', () => {
    expect(
      formatOfferBookingLabel({
        serviceType: 'packaged_offer',
        durationMinutes: 45,
        offerTitle: 'Book lessons and how to apply them',
      }),
    ).toBe('Book lessons and how to apply them (45 min)');
  });

  it('falls back to Packaged session', () => {
    expect(
      formatOfferBookingLabel({
        serviceType: 'packaged_offer',
        durationMinutes: 30,
      }),
    ).toBe('Packaged session (30 min)');
  });
});
