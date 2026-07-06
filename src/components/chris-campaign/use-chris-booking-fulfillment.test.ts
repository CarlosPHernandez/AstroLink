import { describe, expect, it } from 'vitest';
import { classifyConfirmPaymentFailure } from '@/components/chris-campaign/use-chris-booking-fulfillment';

describe('classifyConfirmPaymentFailure', () => {
  it('retries while Stripe has not confirmed the PaymentIntent yet', () => {
    expect(
      classifyConfirmPaymentFailure(409, 'Payment not confirmed yet (status: processing)'),
    ).toEqual({
      state: 'retry',
      message: 'Payment not confirmed yet (status: processing)',
    });
  });

  it('retries transient server and network failures', () => {
    expect(classifyConfirmPaymentFailure(500, 'Webhook database write failed')).toEqual({
      state: 'retry',
      message: 'Webhook database write failed',
    });
    expect(classifyConfirmPaymentFailure(0, 'Network error confirming payment.')).toEqual({
      state: 'retry',
      message: 'Network error confirming payment.',
    });
  });

  it('stops on auth and metadata failures', () => {
    expect(classifyConfirmPaymentFailure(403, 'Forbidden')).toEqual({
      state: 'fatal',
      message: 'Forbidden',
    });
    expect(classifyConfirmPaymentFailure(409, 'Payment metadata mismatch')).toEqual({
      state: 'fatal',
      message: 'Payment metadata mismatch',
    });
  });
});
