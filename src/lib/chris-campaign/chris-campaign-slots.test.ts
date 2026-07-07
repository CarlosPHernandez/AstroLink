import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

import {
  ChrisCampaignSoldOutError,
  getChrisCampaignSlotSnapshot,
  releaseChrisCampaignSlot,
  reserveChrisCampaignSlot,
  shouldReleaseChrisCampaignSlotForStatus,
} from '@/lib/chris-campaign/chris-campaign-slots';

describe('chris-campaign-slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when reserve RPC succeeds', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    await expect(reserveChrisCampaignSlot('chris-sembroski')).resolves.toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('booking_campaign_try_reserve', {
      p_campaign_id: 'chris-sembroski',
    });
  });

  it('returns false when reserve RPC reports no capacity', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    await expect(reserveChrisCampaignSlot('chris-sembroski')).resolves.toBe(false);
  });

  it('throws when reserve RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db down' } });
    await expect(reserveChrisCampaignSlot('chris-sembroski')).rejects.toThrow(
      'Campaign slot reserve failed',
    );
  });

  it('calls release RPC', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await releaseChrisCampaignSlot('chris-sembroski');
    expect(mockRpc).toHaveBeenCalledWith('booking_campaign_release', {
      p_campaign_id: 'chris-sembroski',
    });
  });

  it('releases slots only for non-terminal campaign bookings', () => {
    expect(shouldReleaseChrisCampaignSlotForStatus('confirmed', 'chris-sembroski')).toBe(true);
    expect(shouldReleaseChrisCampaignSlotForStatus('pending_payment', 'chris-sembroski')).toBe(true);
    expect(shouldReleaseChrisCampaignSlotForStatus('cancelled', 'chris-sembroski')).toBe(false);
    expect(shouldReleaseChrisCampaignSlotForStatus('refunded', 'chris-sembroski')).toBe(false);
    expect(shouldReleaseChrisCampaignSlotForStatus('completed', 'chris-sembroski')).toBe(false);
    expect(shouldReleaseChrisCampaignSlotForStatus('confirmed', null)).toBe(false);
  });

  it('computes slots remaining from campaign row', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'chris-sembroski', slot_cap: 10, slots_reserved: 7 },
            error: null,
          }),
        })),
      })),
    });

    await expect(getChrisCampaignSlotSnapshot('chris-sembroski')).resolves.toEqual({
      campaignId: 'chris-sembroski',
      slotCap: 10,
      slotsReserved: 7,
      slotsRemaining: 3,
    });
  });

  it('exposes sold-out error type', () => {
    expect(new ChrisCampaignSoldOutError().name).toBe('ChrisCampaignSoldOutError');
  });
});
