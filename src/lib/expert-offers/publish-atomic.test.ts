import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: mockRpc,
  },
}));

import { OFFER_PUBLISHED_CAP } from '@/lib/expert-offers/constants';
import { publishedCapError } from '@/lib/expert-offers/guards';
import { publishOfferAtomic } from '@/lib/expert-offers/publish-atomic';

const offerRow = {
  id: 'offer-1',
  mentor_id: 'mentor-1',
  title: 'Startup class 101',
  slug: 'startup-class-101',
  description: 'A'.repeat(40),
  duration_minutes: 45,
  price_cents: 1000,
  currency: 'usd',
  status: 'published',
  published_at: '2026-09-16T12:00:00.000Z',
  unpublished_at: null,
  archived_at: null,
  page_views: 0,
  checkout_starts: 0,
  bookings_paid: 0,
  created_at: '2026-09-16T11:00:00.000Z',
  updated_at: '2026-09-16T12:00:00.000Z',
};

describe('publishOfferAtomic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the published row when the RPC succeeds', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true, offer: offerRow }, error: null });

    const result = await publishOfferAtomic({
      offerId: 'offer-1',
      mentorId: 'mentor-1',
      nowIso: '2026-09-16T12:00:00.000Z',
    });

    expect(mockRpc).toHaveBeenCalledWith('publish_expert_offer', {
      p_offer_id: 'offer-1',
      p_mentor_id: 'mentor-1',
      p_now: '2026-09-16T12:00:00.000Z',
      p_cap: OFFER_PUBLISHED_CAP,
    });
    expect(result).toEqual({ ok: true, offer: offerRow });
  });

  it('maps a cap miss to the published-cap error (no extra count-then-update)', async () => {
    mockRpc.mockResolvedValue({ data: { ok: false, error: 'cap' }, error: null });

    const result = await publishOfferAtomic({
      offerId: 'offer-1',
      mentorId: 'mentor-1',
      nowIso: '2026-09-16T12:00:00.000Z',
    });

    expect(result).toEqual({ ok: false, error: publishedCapError() });
  });

  it('maps invalid_status when a concurrent publish already flipped the row', async () => {
    mockRpc.mockResolvedValue({ data: { ok: false, error: 'invalid_status' }, error: null });

    const result = await publishOfferAtomic({
      offerId: 'offer-1',
      mentorId: 'mentor-1',
      nowIso: '2026-09-16T12:00:00.000Z',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Only draft or unpublished sessions can be published.',
    });
  });
});
