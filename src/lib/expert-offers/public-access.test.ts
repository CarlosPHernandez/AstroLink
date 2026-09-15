import { describe, expect, it } from 'vitest';
import { isOfferPubliclyBookable } from '@/lib/expert-offers/public-access';

describe('isOfferPubliclyBookable', () => {
  const ok = {
    status: 'published' as const,
    expert_offers_enabled: true,
    compliance_status: 'approved',
    is_listed: true,
  };

  it('allows published offers on approved listed flag-on mentors', () => {
    expect(isOfferPubliclyBookable(ok)).toBe(true);
  });

  it('rejects draft, unpublished, archived, flag-off, unlisted, unapproved', () => {
    expect(isOfferPubliclyBookable({ ...ok, status: 'draft' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, status: 'unpublished' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, status: 'archived' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, expert_offers_enabled: false })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, is_listed: false })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, compliance_status: 'pending_review' })).toBe(false);
  });
});
