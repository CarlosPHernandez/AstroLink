import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockTransactionInsert = vi.hoisted(() => vi.fn());
const mockTransactionMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingUpdateEq = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockTransactionMaybeSingle,
            })),
          })),
          insert: mockTransactionInsert,
          update: vi.fn(() => ({ eq: vi.fn() })),
        };
      }
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'booking-1', campaign_id: null, status: 'pending_payment' },
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: mockBookingUpdateEq,
          })),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: mockAuditInsert,
        };
      }
      return {};
    }),
  },
}));

import { PaymentAgent } from '@/services/agents/payment-agent';

const succeededPayment = {
  stripeEventId: 'evt_123',
  paymentIntentId: 'pi_123',
  grossAmountCents: 100,
  platformFeeCents: 20,
  destinationStripeAccount: 'platform',
  metadata: {
    booking_id: 'booking-1',
    mentor_id: 'mentor-1',
    mentee_id: 'mentee-1',
  },
};

describe('PaymentAgent.handlePaymentSucceeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditInsert.mockResolvedValue({ error: null });
    mockTransactionInsert.mockResolvedValue({ error: null });
    mockTransactionMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockBookingUpdateEq.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records a transaction and confirms the booking', async () => {
    const result = await new PaymentAgent().handlePaymentSucceeded(succeededPayment);

    expect(result).toEqual({ success: true });
    expect(mockTransactionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_id: 'booking-1',
        stripe_payment_intent_id: 'pi_123',
        gross_amount_cents: 100,
        platform_fee_cents: 20,
        mentor_payout_cents: 80,
        status: 'completed',
        stripe_event_id: 'evt_123',
      }),
    );
    expect(mockBookingUpdateEq).toHaveBeenCalledWith('id', 'booking-1');
  });

  it('does not insert a duplicate transaction for an existing PaymentIntent', async () => {
    mockTransactionMaybeSingle.mockResolvedValueOnce({
      data: { id: 'tx-1' },
      error: null,
    });

    const result = await new PaymentAgent().handlePaymentSucceeded({
      ...succeededPayment,
      stripeEventId: 'client_confirm_pi_123',
    });

    expect(result).toEqual({ processed: true, alreadyRecorded: true });
    expect(mockTransactionInsert).not.toHaveBeenCalled();
    expect(mockBookingUpdateEq).toHaveBeenCalledWith('id', 'booking-1');
  });

  it('can record payment without regressing a completed booking to confirmed', async () => {
    const result = await new PaymentAgent().handlePaymentSucceeded({
      ...succeededPayment,
      confirmBooking: false,
    });

    expect(result).toEqual({ success: true });
    expect(mockTransactionInsert).toHaveBeenCalled();
    expect(mockBookingUpdateEq).not.toHaveBeenCalled();
  });

  it('confirms the booking when a concurrent insert already recorded the transaction', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockTransactionInsert.mockResolvedValueOnce({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const result = await new PaymentAgent().handlePaymentSucceeded(succeededPayment);

    expect(result).toEqual({ processed: true });
    expect(mockBookingUpdateEq).toHaveBeenCalledWith('id', 'booking-1');
  });
});
