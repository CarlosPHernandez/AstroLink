import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockRetrievePaymentIntent = vi.hoisted(() => vi.fn());
const mockRecordBookingPaymentSucceeded = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      retrieve: (...args: unknown[]) => mockRetrievePaymentIntent(...args),
    },
  },
}));

vi.mock('@/lib/post-payment', () => ({
  recordBookingPaymentSucceeded: (...args: unknown[]) =>
    mockRecordBookingPaymentSucceeded(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  },
}));

import { POST } from './route';

const bookingId = '00000000-0000-4000-8000-000000000123';

const booking = {
  id: bookingId,
  status: 'pending_payment',
  stripe_payment_intent_id: 'pi_123',
  mentee_id: 'mentee-1',
  mentor_id: 'mentor-1',
};

function callRoute(id = bookingId) {
  return POST(new Request('http://localhost'), {
    params: Promise.resolve({ id }),
  });
}

describe('POST /api/bookings/[id]/confirm-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockSingle.mockResolvedValue({ data: booking, error: null });
    mockRetrievePaymentIntent.mockResolvedValue({
      id: 'pi_123',
      status: 'succeeded',
      amount: 100,
      application_fee_amount: null,
      transfer_data: null,
      metadata: {
        app: 'astrolink',
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
      },
    });
    mockRecordBookingPaymentSucceeded.mockResolvedValue({
      bookingId,
      alreadyProcessed: false,
    });
  });

  it('records confirmed payment for a succeeded PaymentIntent', async () => {
    const res = await callRoute();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { bookingId, alreadyProcessed: false },
    });
    expect(mockRetrievePaymentIntent).toHaveBeenCalledWith('pi_123');
    expect(mockRecordBookingPaymentSucceeded).toHaveBeenCalledWith({
      stripeEventId: 'client_confirm_pi_123',
      paymentIntentId: 'pi_123',
      grossAmountCents: 100,
      platformFeeCents: 20,
      destinationStripeAccount: 'platform',
      mentorId: 'mentor-1',
      menteeId: 'mentee-1',
    });
  });

  it('rejects unauthenticated users', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await callRoute();

    expect(res.status).toBe(401);
    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    expect(mockRecordBookingPaymentSucceeded).not.toHaveBeenCalled();
  });

  it('rejects users who do not own the booking', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'other-mentee',
      role: 'mentee',
    });

    const res = await callRoute();

    expect(res.status).toBe(403);
    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    expect(mockRecordBookingPaymentSucceeded).not.toHaveBeenCalled();
  });

  it('allows admins to confirm a booking payment', async () => {
    mockGetSession.mockResolvedValueOnce({
      userId: 'admin-1',
      role: 'admin',
    });

    const res = await callRoute();

    expect(res.status).toBe(200);
    expect(mockRecordBookingPaymentSucceeded).toHaveBeenCalled();
  });

  it('returns 404 when the booking is missing', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await callRoute();

    expect(res.status).toBe(404);
    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
  });

  it('rejects bookings without a PaymentIntent id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        ...booking,
        stripe_payment_intent_id: null,
      },
      error: null,
    });

    const res = await callRoute();

    expect(res.status).toBe(409);
    expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    expect(mockRecordBookingPaymentSucceeded).not.toHaveBeenCalled();
  });

  it('rejects PaymentIntents that have not succeeded', async () => {
    mockRetrievePaymentIntent.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'processing',
      amount: 100,
      metadata: {
        app: 'astrolink',
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
      },
    });

    const res = await callRoute();

    expect(res.status).toBe(409);
    expect(mockRecordBookingPaymentSucceeded).not.toHaveBeenCalled();
  });

  it('rejects PaymentIntents with mismatched metadata', async () => {
    mockRetrievePaymentIntent.mockResolvedValueOnce({
      id: 'pi_123',
      status: 'succeeded',
      amount: 100,
      metadata: {
        app: 'astrolink',
        mentee_id: 'other-mentee',
        mentor_id: 'mentor-1',
      },
    });

    const res = await callRoute();

    expect(res.status).toBe(409);
    expect(mockRecordBookingPaymentSucceeded).not.toHaveBeenCalled();
  });
});
