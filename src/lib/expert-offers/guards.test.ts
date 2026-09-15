import { describe, expect, it } from 'vitest';
import {
  assertCanArchive,
  assertCanPublish,
  canEditPriceDuration,
  canEditSlug,
} from '@/lib/expert-offers/guards';

const ready = {
  expert_offers_enabled: true,
  stripe_onboarding_completed: true,
  compliance_status: 'approved',
  is_listed: true,
  slug: 'demo-expert',
};

describe('assertCanPublish', () => {
  it('returns null when the mentor is ready and under the cap', () => {
    expect(assertCanPublish(ready, 0)).toBeNull();
  });

  it('blocks when the flag is off', () => {
    expect(assertCanPublish({ ...ready, expert_offers_enabled: false }, 0)).toMatch(/not enabled/i);
  });

  it('blocks incomplete Stripe, unapproved, unlisted, and the 5-offer cap', () => {
    expect(assertCanPublish({ ...ready, stripe_onboarding_completed: false }, 0)).toMatch(/payout/i);
    expect(assertCanPublish({ ...ready, compliance_status: 'pending_review' }, 0)).toMatch(/approved/i);
    expect(assertCanPublish({ ...ready, is_listed: false }, 0)).toMatch(/listed/i);
    expect(assertCanPublish(ready, 5)).toMatch(/5/);
  });
});

describe('edit rules', () => {
  it('freezes slug after first publish', () => {
    expect(canEditSlug(null)).toBe(true);
    expect(canEditSlug('2026-09-15T00:00:00.000Z')).toBe(false);
  });

  it('freezes price and duration after a paid booking', () => {
    expect(canEditPriceDuration({ publishedAt: null, hasPaidBooking: false })).toBe(true);
    expect(canEditPriceDuration({ publishedAt: '2026-09-15T00:00:00.000Z', hasPaidBooking: false })).toBe(true);
    expect(canEditPriceDuration({ publishedAt: '2026-09-15T00:00:00.000Z', hasPaidBooking: true })).toBe(false);
  });

  it('blocks archive when an upcoming confirmed booking exists', () => {
    expect(assertCanArchive(false)).toBeNull();
    expect(assertCanArchive(true)).toMatch(/upcoming/i);
  });
});
