import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockBookingUpdate = vi.hoisted(() => vi.fn());
const mockPrepareBriefing = vi.hoisted(() => vi.fn());
const mockSendConfirmations = vi.hoisted(() => vi.fn());
const mockProvisionDaily = vi.hoisted(() => vi.fn());

vi.mock('@/lib/booking-payments', () => ({
  isDevSkippedPaymentIntent: vi.fn(() => false),
  isStripePaymentsSkipped: vi.fn(() => true),
}));

vi.mock('@/lib/daily', () => ({
  canProvisionDailyRoom: vi.fn(() => false),
  provisionDailyRoomForBooking: mockProvisionDaily,
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockBookingSingle })),
      })),
      update: vi.fn(() => ({ eq: mockBookingUpdate })),
    })),
  },
}));

vi.mock('@/services/agents/briefing-agent', () => ({
  BriefingAgent: vi.fn(() => ({
    prepareBriefing: mockPrepareBriefing,
  })),
}));

vi.mock('@/services/agents/notification-agent', () => ({
  NotificationAgent: vi.fn(() => ({
    sendBookingConfirmations: mockSendConfirmations,
  })),
}));

import { confirmBookingWithoutPayment, runConfirmedBookingFulfillment } from '@/lib/post-payment';

describe('runConfirmedBookingFulfillment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingSingle.mockResolvedValue({
      data: { id: 'booking-1', daily_room_url: null, briefing_json: null },
      error: null,
    });
    mockPrepareBriefing.mockResolvedValue({});
    mockSendConfirmations.mockResolvedValue(undefined);
  });

  it('runs briefing then notifications', async () => {
    await runConfirmedBookingFulfillment('booking-1');

    expect(mockPrepareBriefing).toHaveBeenCalledWith('booking-1');
    expect(mockSendConfirmations).toHaveBeenCalledWith('booking-1');
  });

  it('skips briefing generation when a ready brief already exists', async () => {
    mockBookingSingle.mockResolvedValueOnce({
      data: {
        id: 'booking-1',
        daily_room_url: null,
        briefing_json: { version: 2, mentee: {}, mentor: {} },
      },
      error: null,
    });

    await runConfirmedBookingFulfillment('booking-1');

    expect(mockPrepareBriefing).not.toHaveBeenCalled();
    expect(mockSendConfirmations).toHaveBeenCalledWith('booking-1');
  });
});

describe('confirmBookingWithoutPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareBriefing.mockResolvedValue({});
    mockSendConfirmations.mockResolvedValue(undefined);
    mockBookingUpdate.mockResolvedValue({ error: null });
  });

  it('confirms pending booking and sends notifications', async () => {
    mockBookingSingle.mockResolvedValue({
      data: { id: 'booking-1', status: 'pending_payment', daily_room_url: null },
      error: null,
    });

    const result = await confirmBookingWithoutPayment('booking-1');

    expect(result).toEqual({ bookingId: 'booking-1', alreadyProcessed: false });
    expect(mockSendConfirmations).toHaveBeenCalledWith('booking-1');
  });
});
