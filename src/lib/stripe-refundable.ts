const REFUNDABLE_BOOKING_STATUSES = new Set(['confirmed']);

export function shouldCreateStripeRefund(input: {
  refundableByPolicy: boolean;
  bookingStatus: string;
  paymentIntentId: string;
}): boolean {
  if (!input.refundableByPolicy) {
    return false;
  }
  if (!REFUNDABLE_BOOKING_STATUSES.has(input.bookingStatus)) {
    return false;
  }
  return input.paymentIntentId.startsWith('pi_');
}
