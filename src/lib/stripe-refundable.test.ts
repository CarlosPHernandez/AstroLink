import { describe, expect, it } from 'vitest';
import { shouldCreateStripeRefund } from './stripe-refundable';

describe('shouldCreateStripeRefund', () => {
  it('refunds only confirmed live PaymentIntents', () => {
    expect(
      shouldCreateStripeRefund({
        refundableByPolicy: true,
        bookingStatus: 'confirmed',
        paymentIntentId: 'pi_abc',
      }),
    ).toBe(true);
  });

  it('does not call Stripe for free-session or skipped ids', () => {
    expect(
      shouldCreateStripeRefund({
        refundableByPolicy: true,
        bookingStatus: 'confirmed',
        paymentIntentId: 'free_session_abc',
      }),
    ).toBe(false);
    expect(
      shouldCreateStripeRefund({
        refundableByPolicy: true,
        bookingStatus: 'confirmed',
        paymentIntentId: 'dev_skip_abc',
      }),
    ).toBe(false);
  });

  it('does not refund pending or failed bookings', () => {
    expect(
      shouldCreateStripeRefund({
        refundableByPolicy: true,
        bookingStatus: 'pending_payment',
        paymentIntentId: 'pi_abc',
      }),
    ).toBe(false);
    expect(
      shouldCreateStripeRefund({
        refundableByPolicy: true,
        bookingStatus: 'payment_failed',
        paymentIntentId: 'pi_abc',
      }),
    ).toBe(false);
  });
});
