import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMentorPool = vi.hoisted(() => vi.fn());
const mockMentorSingle = vi.hoisted(() => vi.fn());
const mockBookingInsert = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockGenerateStructuredJson = vi.hoisted(() => vi.fn());
const mockReserveSlot = vi.hoisted(() => vi.fn());
const mockReleaseSlot = vi.hoisted(() => vi.fn());
const mockIsStripePaymentsSkipped = vi.hoisted(() => vi.fn());
const mockStripePaymentIntentsCreate = vi.hoisted(() => vi.fn());
const mockStripePaymentIntentsUpdate = vi.hoisted(() => vi.fn());
const mockGetOrCreateStripeCustomerForMentee = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'mentors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => mockMentorPool()),
              single: mockMentorSingle,
            })),
          })),
        };
      }
      if (table === 'bookings') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: mockBookingInsert,
            })),
          })),
        };
      }
      if (table === 'audit_log') {
        return { insert: mockAuditInsert };
      }
      return { select: vi.fn() };
    }),
  },
}));

vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return {
    ...actual,
    callLlmWithBackoff: (fn: () => Promise<unknown>) => fn(),
    generateStructuredJson: (...args: unknown[]) => mockGenerateStructuredJson(...args),
    llmFlashModel: 'test-model',
  };
});

vi.mock('@/lib/post-payment', () => ({
  confirmBookingWithoutPayment: vi.fn().mockResolvedValue({ bookingId: 'booking-1' }),
}));

vi.mock('@/lib/chris-campaign/chris-campaign-slots', () => ({
  ChrisCampaignSoldOutError: class ChrisCampaignSoldOutError extends Error {
    name = 'ChrisCampaignSoldOutError';
  },
  reserveChrisCampaignSlot: (...args: unknown[]) => mockReserveSlot(...args),
  releaseChrisCampaignSlot: (...args: unknown[]) => mockReleaseSlot(...args),
}));

vi.mock('@/lib/booking-payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/booking-payments')>();
  return {
    ...actual,
    isStripePaymentsSkipped: (...args: unknown[]) => mockIsStripePaymentsSkipped(...args),
  };
});

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: (...args: unknown[]) => mockStripePaymentIntentsCreate(...args),
      update: (...args: unknown[]) => mockStripePaymentIntentsUpdate(...args),
    },
  },
}));

vi.mock('@/lib/stripe-customer', () => ({
  getOrCreateStripeCustomerForMentee: (...args: unknown[]) =>
    mockGetOrCreateStripeCustomerForMentee(...args),
}));

import { BookingAgent } from '@/services/agents/booking-agent';

const mentorPool = [
  {
    id: 'mentor-1',
    full_name: 'Ada Expert',
    employer: 'Orbit Labs',
    expertise: ['propulsion'],
    bio: 'Rocket engineer',
  },
];

const approvedMentor = {
  stripe_connect_account_id: 'acct_123',
  live_session_price_cents: 15000,
  is_listed: true,
  compliance_status: 'approved',
};

describe('BookingAgent (immediate-capture payments, platform-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditInsert.mockResolvedValue({ error: null });
    mockMentorPool.mockResolvedValue({ data: mentorPool, error: null });
    mockMentorSingle.mockResolvedValue({ data: approvedMentor, error: null });
    mockBookingInsert.mockResolvedValue({
      data: { id: 'booking-1' },
      error: null,
    });
    mockReserveSlot.mockResolvedValue(true);
    mockReleaseSlot.mockResolvedValue(undefined);
    mockIsStripePaymentsSkipped.mockReturnValue(true);
    mockStripePaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_secret_123',
    });
    mockStripePaymentIntentsUpdate.mockResolvedValue({ id: 'pi_test_123' });
    mockGetOrCreateStripeCustomerForMentee.mockResolvedValue('cus_test_123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts a mentor id returned by the LLM when it exists in the pool', async () => {
    mockGenerateStructuredJson.mockResolvedValue({
      mentor_id: 'mentor-1',
      match_score: 0.92,
      match_reason: 'Strong propulsion fit.',
    });

    const agent = new BookingAgent();
    const result = await agent.bookSession({
      menteeId: 'mentee-1',
      serviceType: 'session_1on1',
      scheduledAt: new Date().toISOString(),
      menteeGoals: 'Learn about propulsion',
      menteeBackground: 'Early-career engineer',
    });

    expect(result.bookingId).toBe('booking-1');
    expect(mockGenerateStructuredJson).toHaveBeenCalled();
  });

  it('throws when the LLM returns an id outside the mentor pool', async () => {
    mockGenerateStructuredJson.mockResolvedValue({
      mentor_id: 'hallucinated-mentor',
      match_score: 0.88,
      match_reason: 'Looks credible.',
    });

    const agent = new BookingAgent();
    await expect(
      agent.bookSession({
        menteeId: 'mentee-1',
        serviceType: 'session_1on1',
        scheduledAt: new Date().toISOString(),
        menteeGoals: 'Learn about propulsion',
        menteeBackground: 'Early-career engineer',
      }),
    ).rejects.toThrow('Matching engine returned an unknown expert');
  });

  it('throws when the mentor pool is empty', async () => {
    mockMentorPool.mockResolvedValue({ data: [], error: null });

    const agent = new BookingAgent();
    await expect(
      agent.bookSession({
        menteeId: 'mentee-1',
        serviceType: 'session_1on1',
        scheduledAt: new Date().toISOString(),
        menteeGoals: 'Learn about propulsion',
        menteeBackground: 'Early-career engineer',
      }),
    ).rejects.toThrow('No approved mentors available in the pool.');
    expect(mockGenerateStructuredJson).not.toHaveBeenCalled();
  });

  it('reserves a campaign slot before creating the booking', async () => {
    const agent = new BookingAgent();
    await agent.bookSession({
      menteeId: 'mentee-1',
      mentorId: 'mentor-1',
      serviceType: 'session_1on1',
      scheduledAt: new Date().toISOString(),
      menteeGoals: 'Learn about propulsion',
      menteeBackground: 'Early-career engineer',
      campaignId: 'chris-sembroski',
    });

    expect(mockReserveSlot).toHaveBeenCalledWith('chris-sembroski');
    expect(mockReleaseSlot).not.toHaveBeenCalled();
  });

  it('releases campaign slot when booking insert fails', async () => {
    mockBookingInsert.mockResolvedValue({
      data: null,
      error: { message: 'insert failed' },
    });

    const agent = new BookingAgent();
    await expect(
      agent.bookSession({
        menteeId: 'mentee-1',
        mentorId: 'mentor-1',
        serviceType: 'session_1on1',
        scheduledAt: new Date().toISOString(),
        menteeGoals: 'Learn about propulsion',
        menteeBackground: 'Early-career engineer',
        campaignId: 'chris-sembroski',
      }),
    ).rejects.toThrow('Failed to create database booking');

    expect(mockReleaseSlot).toHaveBeenCalledWith('chris-sembroski');
  });

  it('throws sold out when campaign reserve returns false', async () => {
    mockReserveSlot.mockResolvedValue(false);
    const { ChrisCampaignSoldOutError } = await import('@/lib/chris-campaign/chris-campaign-slots');

    const agent = new BookingAgent();
    await expect(
      agent.bookSession({
        menteeId: 'mentee-1',
        mentorId: 'mentor-1',
        serviceType: 'session_1on1',
        scheduledAt: new Date().toISOString(),
        menteeGoals: 'Learn about propulsion',
        menteeBackground: 'Early-career engineer',
        campaignId: 'chris-sembroski',
      }),
    ).rejects.toBeInstanceOf(ChrisCampaignSoldOutError);
  });

  it('creates Chris campaign PaymentIntent for the $180 launch amount without Stripe discounts', async () => {
    mockIsStripePaymentsSkipped.mockReturnValue(false);

    const agent = new BookingAgent();
    const result = await agent.bookSession({
      menteeId: 'mentee-1',
      mentorId: 'mentor-1',
      serviceType: 'session_1on1',
      scheduledAt: '2030-01-01T18:00:00.000Z',
      menteeGoals: 'Learn about propulsion',
      menteeBackground: 'Early-career engineer',
      campaignId: 'chris-sembroski',
      marketingReferrer: 'chris-sembroski',
    });

    expect(result).toEqual(
      expect.objectContaining({
        bookingId: 'booking-1',
        stripeClientSecret: 'pi_test_secret_123',
        skipPayment: false,
        amountCents: 18000,
      }),
    );
    expect(mockGetOrCreateStripeCustomerForMentee).toHaveBeenCalledWith('mentee-1');
    expect(mockStripePaymentIntentsCreate).toHaveBeenCalledTimes(1);

    const [paymentIntentParams, requestOptions] = mockStripePaymentIntentsCreate.mock.calls[0];
    expect(paymentIntentParams).toEqual(
      expect.objectContaining({
        amount: 18000,
        currency: 'usd',
        customer: 'cus_test_123',
        metadata: expect.objectContaining({
          app: 'astrolink',
          mentor_id: 'mentor-1',
          mentee_id: 'mentee-1',
          service_type: 'session_1on1',
          campaign_id: 'chris-sembroski',
          marketing_referrer: 'chris-sembroski',
          pricing_mode: 'chris_launch_discount_10_percent',
          original_amount_cents: '20000',
          charged_amount_cents: '18000',
          discount_label: 'Inspired24',
          discount_percent: '10',
        }),
      }),
    );
    expect(paymentIntentParams).not.toHaveProperty('discounts');
    expect(requestOptions).toEqual({
      idempotencyKey: 'astrolink_book_mentee-1_mentor-1_2030-01-01T18:00:00.000Z',
    });
  });

  it('keeps non-campaign PaymentIntent amount server-calculated without Chris pricing metadata', async () => {
    mockIsStripePaymentsSkipped.mockReturnValue(false);

    const agent = new BookingAgent();
    const result = await agent.bookSession({
      menteeId: 'mentee-1',
      mentorId: 'mentor-1',
      serviceType: 'session_1on1',
      scheduledAt: '2030-01-02T18:00:00.000Z',
      menteeGoals: 'Learn about propulsion',
      menteeBackground: 'Early-career engineer',
      durationMinutes: 30,
    });

    expect(result.amountCents).toBe(7500);
    expect(mockReserveSlot).not.toHaveBeenCalled();
    const [paymentIntentParams] = mockStripePaymentIntentsCreate.mock.calls[0];
    expect(paymentIntentParams).toEqual(
      expect.objectContaining({
        amount: 7500,
        currency: 'usd',
        customer: 'cus_test_123',
        metadata: expect.objectContaining({
          app: 'astrolink',
          mentor_id: 'mentor-1',
          mentee_id: 'mentee-1',
          service_type: 'session_1on1',
        }),
      }),
    );
    expect(paymentIntentParams).not.toHaveProperty('discounts');
    expect(paymentIntentParams.metadata).not.toHaveProperty('pricing_mode');
  });
});
