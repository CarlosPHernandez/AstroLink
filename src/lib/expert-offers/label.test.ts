import { describe, expect, it } from 'vitest';
import { formatOfferBookingLabel, formatOfferStatusLabel } from '@/lib/expert-offers/label';

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

describe('formatOfferStatusLabel', () => {
  it('title-cases dashboard status chips', () => {
    expect(formatOfferStatusLabel('published')).toBe('Published');
    expect(formatOfferStatusLabel('draft')).toBe('Draft');
    expect(formatOfferStatusLabel('unpublished')).toBe('Unpublished');
    expect(formatOfferStatusLabel('archived')).toBe('Archived');
  });
});
