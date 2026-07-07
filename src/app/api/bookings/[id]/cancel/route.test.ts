import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockStripeRefundCreate = vi.hoisted(() => vi.fn());
const mockSupabaseFrom = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockBookingsUpdateEq = vi.hoisted(() => vi.fn());
const mockTransactionsUpdateEq = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockReleaseChrisCampaignSlot = vi.hoisted(() => vi.fn());
const mockAssertCancelRateLimit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    refunds: {
      create: (...args: unknown[]) => mockStripeRefundCreate(...args),
    },
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: mockSupabaseFrom,
  },
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

vi.mock('@/lib/booking-rate-limit', () => ({
  assertBookingCancelRateLimit: (...args: unknown[]) => mockAssertCancelRateLimit(...args),
  getBookingClientKey: () => 'mentee-1',
  isBookingRateLimitError: () => false,
}));

import { POST } from './route';

const bookingId = '00000000-0000-4000-8000-000000000123';

function callRoute() {
  return POST(new Request('http://localhost/api/bookings/123/cancel'), {
    params: Promise.resolve({ id: bookingId }),
  });
}

describe('POST /api/bookings/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 'mentee-1', role: 'mentee' });
    mockStripeRefundCreate.mockResolvedValue({ id: 're_123' });
    mockBookingsUpdateEq.mockResolvedValue({ error: null });
    mockTransactionsUpdateEq.mockResolvedValue({ error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
    mockReleaseChrisCampaignSlot.mockResolvedValue(undefined);
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockBookingSingle,
            })),
          })),
          update: vi.fn(() => ({
            eq: mockBookingsUpdateEq,
          })),
        };
      }
      if (table === 'transactions') {
        return {
          update: vi.fn(() => ({
            eq: mockTransactionsUpdateEq,
          })),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: mockAuditInsert,
        };
      }
      return {};
    });
  });

  it('refunds a paid Chris booking and releases the campaign slot', async () => {
    mockBookingSingle.mockResolvedValue({
      data: {
        id: bookingId,
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
        status: 'confirmed',
        scheduled_at: '2099-01-01T18:00:00.000Z',
        stripe_payment_intent_id: 'pi_123',
        campaign_id: 'chris-sembroski',
      },
      error: null,
    });

    const res = await callRoute();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          bookingId,
          status: 'refunded',
          refunded: true,
          refundId: 're_123',
        }),
      }),
    );
    expect(mockStripeRefundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_123',
      metadata: {
        app: 'astrolink',
        booking_id: bookingId,
      },
    });
    expect(mockReleaseChrisCampaignSlot).toHaveBeenCalledWith('chris-sembroski');
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'CHRIS_CAMPAIGN_SLOT_RELEASED',
        ref_id: bookingId,
        payload: expect.objectContaining({
          campaign_id: 'chris-sembroski',
          previous_status: 'confirmed',
          reason: 'booking_refunded',
        }),
      }),
    );
  });

  it('does not release a slot for an already terminal Chris booking', async () => {
    mockBookingSingle.mockResolvedValue({
      data: {
        id: bookingId,
        mentee_id: 'mentee-1',
        mentor_id: 'mentor-1',
        status: 'refunded',
        scheduled_at: '2099-01-01T18:00:00.000Z',
        stripe_payment_intent_id: 'pi_123',
        campaign_id: 'chris-sembroski',
      },
      error: null,
    });

    const res = await callRoute();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({
      bookingId,
      alreadyProcessed: true,
      status: 'refunded',
    });
    expect(mockStripeRefundCreate).not.toHaveBeenCalled();
    expect(mockReleaseChrisCampaignSlot).not.toHaveBeenCalled();
    expect(mockBookingsUpdateEq).not.toHaveBeenCalled();
  });
});
