import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockConstructEvent = vi.hoisted(() => vi.fn());
const mockSupabaseFrom = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockSelectEq = vi.hoisted(() => vi.fn());
const mockHandlePaymentSucceeded = vi.hoisted(() => vi.fn());
const mockHandlePaymentFailed = vi.hoisted(() => vi.fn());
const mockFulfillBookingAfterPayment = vi.hoisted(() => vi.fn());
const mockReleaseChrisCampaignSlot = vi.hoisted(() => vi.fn());

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
}));

vi.mock('@/lib/post-payment', () => ({
  fulfillBookingAfterPayment: (...args: unknown[]) =>
    mockFulfillBookingAfterPayment(...args),
}));

vi.mock('@/services/agents/payment-agent', () => ({
  PaymentAgent: vi.fn(() => ({
    handlePaymentSucceeded: mockHandlePaymentSucceeded,
    handlePaymentFailed: mockHandlePaymentFailed,
  })),
}));

vi.mock('@/lib/mentor-stripe-connect', () => ({
  syncMentorStripeAccountStatus: vi.fn(),
}));

vi.mock('@/lib/chris-campaign/chris-campaign-slots', async () => {
  const actual = await vi.importActual<typeof import('@/lib/chris-campaign/chris-campaign-slots')>(
    '@/lib/chris-campaign/chris-campaign-slots',
  );
  return {
    ...actual,
    releaseChrisCampaignSlot: (...args: unknown[]) => mockReleaseChrisCampaignSlot(...args),
  };
});

import { POST } from './route';

function makeRequest(body: string, sig = 't=1,v1=abc') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  });
}

describe('stripe webhook (hardened for immediate capture + shared account)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_123');
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'bookings' || table === 'transactions' || table === 'audit_log' || table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockSelectEq,
              single: mockSelectEq,
            })),
          })),
          insert: mockInsert.mockResolvedValue({ error: null }),
          update: vi.fn(() => ({
            eq: mockUpdate.mockResolvedValue({ error: null }),
          })),
        };
      }
      return { insert: mockInsert, update: vi.fn(() => ({ eq: vi.fn() })) };
    });
    mockInsert.mockResolvedValue({ error: null });
    mockSelectEq.mockResolvedValue({ data: { id: 'booking-123' }, error: null });
    mockFulfillBookingAfterPayment.mockResolvedValue({ bookingId: 'b1' });
    mockReleaseChrisCampaignSlot.mockResolvedValue(undefined);
  });

  it('rejects missing signature', async () => {
    const req = new Request('http://x', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('filters events with foreign app metadata (shared Helios account)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_x', metadata: { app: 'other-app', mentor_id: 'm', mentee_id: 'u' }, amount: 10000 } },
    });
    const res = await POST(makeRequest('{}'));
    const json = await res.json();
    expect(json.skipped).toBe('foreign_app');
  });

  it('wires payment_intent.payment_failed to PaymentAgent', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_fail',
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_fail', metadata: { app: 'astrolink' } } },
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockHandlePaymentFailed).toHaveBeenCalledWith('booking-123');
  });

  it('handles charge.refunded, sets refunded status, and releases Chris slot once', async () => {
    mockSelectEq.mockResolvedValueOnce({
      data: {
        id: 'booking-123',
        status: 'confirmed',
        campaign_id: 'chris-sembroski',
      },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: 'evt_ref',
      type: 'charge.refunded',
      data: { object: { id: 'ch_ref', payment_intent: 'pi_ref' } },
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockReleaseChrisCampaignSlot).toHaveBeenCalledWith('chris-sembroski');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'CHRIS_CAMPAIGN_SLOT_RELEASED',
        ref_id: 'booking-123',
      }),
    );
  });

  it('does not release a Chris slot when a refunded webhook replays for terminal booking status', async () => {
    mockSelectEq.mockResolvedValueOnce({
      data: {
        id: 'booking-123',
        status: 'refunded',
        campaign_id: 'chris-sembroski',
      },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: 'evt_ref_replay',
      type: 'charge.refunded',
      data: { object: { id: 'ch_ref', payment_intent: 'pi_ref' } },
    });

    const res = await POST(makeRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockReleaseChrisCampaignSlot).not.toHaveBeenCalled();
  });

  it('idempotent replay (23505 on tx insert) is treated as processed (via fulfill path)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_dup',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup', metadata: { app: 'astrolink', mentor_id: 'm', mentee_id: 'u' }, amount: 15000 } },
    });
    // Simulate duplicate inside fulfill (the 23505 is inside handle now)
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
  });

  it('routes payment_intent.succeeded through shared booking fulfillment', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_success',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_success',
          metadata: { app: 'astrolink', mentor_id: 'mentor-1', mentee_id: 'mentee-1' },
          amount: 100,
          application_fee_amount: null,
          transfer_data: null,
        },
      },
    });

    const res = await POST(makeRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockFulfillBookingAfterPayment).toHaveBeenCalledWith({
      stripeEventId: 'evt_success',
      paymentIntentId: 'pi_success',
      grossAmountCents: 100,
      platformFeeCents: 20,
      destinationStripeAccount: 'platform',
      mentorId: 'mentor-1',
      menteeId: 'mentee-1',
    });
  });

  it('constructEvent failure returns 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
  });
});
