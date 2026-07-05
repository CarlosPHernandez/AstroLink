import 'server-only';

import { stripe } from '@/lib/stripe';

export type StripePaymentIntentDiscount =
  | { coupon: string }
  | { promotion_code: string };

/**
 * Optional Stripe discount for Chris campaign PaymentIntents.
 * Prefer CHRIS_STRIPE_COUPON_ID; fall back to lookup by CHRIS_STRIPE_PROMOTION_CODE.
 */
export async function getChrisCampaignStripeDiscounts(): Promise<StripePaymentIntentDiscount[]> {
  const couponId = process.env.CHRIS_STRIPE_COUPON_ID?.trim();
  if (couponId) {
    // Auto-detect:
    // - Real coupon IDs usually start with "coupon_" → use { coupon: id }
    // - Short/custom IDs or promo codes (e.g. "OMFhV6g2", "TST-GFT") → use { promotion_code: id }
    // This prevents "unknown parameter: discounts" / "no such coupon" when users paste
    // the ID shown in the Stripe dashboard for their test coupon.
    if (couponId.startsWith('coupon_')) {
      return [{ coupon: couponId }];
    } else {
      return [{ promotion_code: couponId }];
    }
  }

  const promoCode = process.env.CHRIS_STRIPE_PROMOTION_CODE?.trim();
  if (!promoCode) {
    return [];
  }

  const { data } = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
    limit: 1,
  });

  const coupon = (data[0] as { coupon?: string | { id: string } } | undefined)?.coupon;
  const resolvedCouponId = typeof coupon === 'string' ? coupon : coupon?.id;
  if (!resolvedCouponId) {
    return [];
  }

  return [{ coupon: resolvedCouponId }];
}