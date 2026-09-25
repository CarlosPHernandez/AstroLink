import { describe, expect, it } from 'vitest';
import { bookingOfferBackNav, offerPublicPath } from '@/lib/expert-offers/path';

describe('offerPublicPath', () => {
  it('builds the canonical share path', () => {
    expect(offerPublicPath('eiman-jahangir', 'book-lessons-and-how-to-apply-them')).toBe(
      '/s/eiman-jahangir/book-lessons-and-how-to-apply-them',
    );
  });
});

describe('bookingOfferBackNav', () => {
  it('returns the public session URL when an offer is locked in', () => {
    expect(
      bookingOfferBackNav({
        mentorSlug: 'chris-sembroski',
        offerSlug: 'book-lessons',
      }),
    ).toEqual({
      href: '/s/chris-sembroski/book-lessons',
      label: 'Session',
    });
  });

  it('keeps the Chris campaign back-link when no offer is set', () => {
    expect(bookingOfferBackNav({ chrisCampaign: true })).toEqual({
      href: '/talk-with-chris',
      label: 'Talk with Chris',
    });
  });

  it('falls back to the directory', () => {
    expect(bookingOfferBackNav({})).toEqual({
      href: '/experts',
      label: 'Directory',
    });
  });
});
