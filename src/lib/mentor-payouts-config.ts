/** False at launch — manual payouts. Set ENABLE_STRIPE_CONNECT_PAYOUTS=true to restore Connect API + CTAs. */
export function isStripeConnectPayoutsEnabled(): boolean {
  return process.env.ENABLE_STRIPE_CONNECT_PAYOUTS === 'true';
}

export type PayoutNavStatus = 'dev_skip' | 'manual' | 'connected' | 'setup_required';

export function resolvePayoutNavStatus(params: {
  skipStripePayments: boolean;
  connectPayoutsEnabled: boolean;
  stripeOnboardingCompleted: boolean;
}): PayoutNavStatus {
  if (params.skipStripePayments) {
    return 'dev_skip';
  }
  if (!params.connectPayoutsEnabled) {
    return 'manual';
  }
  if (params.stripeOnboardingCompleted) {
    return 'connected';
  }
  return 'setup_required';
}

export const PAYOUT_NAV_LABELS: Record<PayoutNavStatus, string> = {
  dev_skip: 'Connected',
  manual: 'Manual payouts',
  connected: 'Connected',
  setup_required: 'Setup required',
};