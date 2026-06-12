import 'server-only';

/** Local/dev only — skip Stripe checkout and auto-confirm bookings for AI flow testing. */
export function isStripePaymentsSkipped(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.SKIP_STRIPE_PAYMENTS === 'true';
}

/** Local/dev only — checkout without Connect destination and relaxed fee validation. */
export function isStripeBookingTestMode(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.STRIPE_BOOKING_TEST_MODE === 'true';
}

export function isDevSkippedPaymentIntent(paymentIntentId: string): boolean {
  return paymentIntentId.startsWith('dev_skip_');
}

export function createDevSkippedPaymentIntentId(): string {
  return `dev_skip_${crypto.randomUUID()}`;
}
