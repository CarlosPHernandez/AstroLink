import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPromotionCodesList = vi.hoisted(() => vi.fn());

vi.mock('@/lib/stripe', () => ({
  stripe: {
    promotionCodes: {
      list: mockPromotionCodesList,
    },
  },
}));

import { getChrisCampaignStripeDiscounts } from '@/lib/chris-campaign/chris-stripe-promo';

describe('getChrisCampaignStripeDiscounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns coupon from CHRIS_STRIPE_COUPON_ID when set', async () => {
    vi.stubEnv('CHRIS_STRIPE_COUPON_ID', 'coupon_chris_test');
    await expect(getChrisCampaignStripeDiscounts()).resolves.toEqual([
      { coupon: 'coupon_chris_test' },
    ]);
    expect(mockPromotionCodesList).not.toHaveBeenCalled();
  });

  it('looks up promotion code when coupon id is unset', async () => {
    vi.stubEnv('CHRIS_STRIPE_PROMOTION_CODE', 'CHRIS2026');
    mockPromotionCodesList.mockResolvedValue({
      data: [{ coupon: { id: 'coupon_from_promo' } }],
    });

    await expect(getChrisCampaignStripeDiscounts()).resolves.toEqual([
      { coupon: 'coupon_from_promo' },
    ]);
    expect(mockPromotionCodesList).toHaveBeenCalledWith({
      code: 'CHRIS2026',
      active: true,
      limit: 1,
    });
  });

  it('returns empty array when no promo env is configured', async () => {
    await expect(getChrisCampaignStripeDiscounts()).resolves.toEqual([]);
  });
});