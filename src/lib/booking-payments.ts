import 'server-only';

/** Local/dev only — skip Stripe checkout and auto-confirm bookings for AI flow testing. */
export function isStripePaymentsSkipped(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.SKIP_STRIPE_PAYMENTS === 'true';
}

export function isDevSkippedPaymentIntent(paymentIntentId: string): boolean {
  return (
    paymentIntentId.startsWith('dev_skip_') || paymentIntentId.startsWith('free_session_')
  );
}

export function createDevSkippedPaymentIntentId(): string {
  return `dev_skip_${crypto.randomUUID()}`;
}

/** Production-safe free bookings ($0 charge) — no Stripe PaymentIntent. */
export function createFreeSessionPaymentIntentId(): string {
  return `free_session_${crypto.randomUUID()}`;
}
