import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMentorPool = vi.hoisted(() => vi.fn());
const mockMentorSingle = vi.hoisted(() => vi.fn());
const mockBookingInsert = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockGenerateStructuredJson = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/booking-payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/booking-payments')>();
  return {
    ...actual,
    isStripePaymentsSkipped: vi.fn(() => true),
  };
});

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
});
