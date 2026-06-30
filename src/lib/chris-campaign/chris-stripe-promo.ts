import 'server-only';

import { stripe } from '@/lib/stripe';

export type StripePaymentIntentDiscount = { coupon: string };

/**
 * Optional Stripe discount for Chris campaign PaymentIntents.
 * Prefer CHRIS_STRIPE_COUPON_ID; fall back to lookup by CHRIS_STRIPE_PROMOTION_CODE.
 */
export async function getChrisCampaignStripeDiscounts(): Promise<StripePaymentIntentDiscount[]> {
  const couponId = process.env.CHRIS_STRIPE_COUPON_ID?.trim();
  if (couponId) {
    return [{ coupon: couponId }];
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