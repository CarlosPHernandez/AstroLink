import { describe, expect, it, vi } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/booking-payments', () => ({
  isDevSkippedPaymentIntent: vi.fn(() => true),
}));

vi.mock('@/services/agents/session-agent', () => ({
  SessionAgent: vi.fn(),
}));

vi.mock('@/services/agents/payment-agent', () => ({
  PaymentAgent: vi.fn(),
}));

import { SessionAgent } from '@/services/agents/session-agent';
import { fulfillBookingAfterMeetingEnded } from '@/lib/post-session';

describe('fulfillBookingAfterMeetingEnded', () => {
  it('is idempotent when booking already completed', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'booking-1',
        status: 'completed',
        stripe_payment_intent_id: 'pi_dev_skip',
        daily_room_url: 'https://astrolink.daily.co/astrolink-booking1',
      },
      error: null,
    });

    const result = await fulfillBookingAfterMeetingEnded({
      room: 'astrolink-booking1',
      start_ts: 1000,
      end_ts: 1900,
    });

    expect(result).toEqual({
      processed: true,
      bookingId: 'booking-1',
      alreadyProcessed: true,
    });
    expect(SessionAgent).not.toHaveBeenCalled();
  });
});
