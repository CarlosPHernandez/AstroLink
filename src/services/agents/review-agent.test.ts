import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockReviewSelect = vi.hoisted(() => vi.fn());
const mockReviewInsert = vi.hoisted(() => vi.fn());
const mockReviewMaybeSingle = vi.hoisted(() => vi.fn());
const mockReviewUpdateMaybeSingle = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockCallLlmWithBackoff = vi.hoisted(() => vi.fn());
const mockRevalidateExpertReviews = vi.hoisted(() => vi.fn());

vi.mock('@/lib/llm', () => ({
  callLlmWithBackoff: () => mockCallLlmWithBackoff(),
}));

vi.mock('@/lib/expert-reviews', () => ({
  revalidateExpertReviews: (...args: unknown[]) => mockRevalidateExpertReviews(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockBookingSingle })) })),
        };
      }
      if (table === 'expert_reviews') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: mockReviewSelect,
              maybeSingle: mockReviewMaybeSingle,
            })),
          })),
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockReviewInsert })) })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({ maybeSingle: mockReviewUpdateMaybeSingle })),
              })),
              select: vi.fn(() => ({ maybeSingle: mockReviewUpdateMaybeSingle })),
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

import { ReviewAgent } from '@/services/agents/review-agent';

const bookingId = 'booking-0000-0000-0000-000000000001';

describe('ReviewAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingSingle.mockResolvedValue({
      data: {
        id: bookingId,
        mentor_id: 'mentor-1',
        mentee_id: 'mentee-1',
        status: 'completed',
      },
      error: null,
    });
    mockReviewSelect.mockResolvedValue({ data: [], error: null });
    mockReviewInsert.mockResolvedValue({ data: { id: 'review-1' }, error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
    mockCallLlmWithBackoff.mockResolvedValue({
      allowed: true,
      reason: 'Safe to publish',
      quote_safe: true,
      display_name_safe: true,
      recommended_display_name: 'Verified Astro-Link user',
      policy_flags: [],
    });
  });

  it('creates a pending review for a completed booking', async () => {
    const agent = new ReviewAgent();

    const reviewId = await agent.submitReview({
      bookingId,
      reviewerUserId: 'mentee-1',
      rating: 5,
      quote: 'This session was extremely helpful and actionable.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: true,
    });

    expect(reviewId).toBe('review-1');
    expect(mockReviewInsert).toHaveBeenCalled();
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: 'APX-09',
        event: 'EXPERT_REVIEW_SUBMITTED',
      }),
    );
  });

  it('rejects when the booking is not completed', async () => {
    mockBookingSingle.mockResolvedValueOnce({
      data: {
        id: bookingId,
        mentor_id: 'mentor-1',
        mentee_id: 'mentee-1',
        status: 'confirmed',
      },
      error: null,
    });

    const agent = new ReviewAgent();

    await expect(
      agent.submitReview({
        bookingId,
        reviewerUserId: 'mentee-1',
        rating: 5,
        quote: 'This session was extremely helpful and actionable.',
        displayName: 'Verified Astro-Link user',
        attributionType: 'anonymous',
        consentToPublish: true,
      }),
    ).rejects.toThrow('Review may only be submitted for completed sessions.');
  });

  it('rejects when a review already exists for the booking', async () => {
    mockReviewSelect.mockResolvedValueOnce({ data: [{ id: 'existing-review' }], error: null });
    const agent = new ReviewAgent();

    await expect(
      agent.submitReview({
        bookingId,
        reviewerUserId: 'mentee-1',
        rating: 5,
        quote: 'This session was extremely helpful and actionable.',
        displayName: 'Verified Astro-Link user',
        attributionType: 'anonymous',
        consentToPublish: true,
      }),
    ).rejects.toThrow('A review already exists for this booking.');
  });

  it('rejects approve when consent_to_publish is false', async () => {
    mockReviewMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'review-1',
        expert_id: 'mentor-1',
        consent_to_publish: false,
        status: 'pending',
      },
      error: null,
    });
    const agent = new ReviewAgent();

    await expect(agent.approveReview('review-1', 'admin-1')).rejects.toThrow(
      'Cannot approve without consent to publish',
    );
    expect(mockReviewUpdateMaybeSingle).not.toHaveBeenCalled();
  });

  it('approves without forcing consent_to_publish', async () => {
    mockReviewMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'review-1',
        expert_id: 'mentor-1',
        consent_to_publish: true,
        status: 'pending',
      },
      error: null,
    });
    mockReviewUpdateMaybeSingle.mockResolvedValueOnce({
      data: { id: 'review-1', expert_id: 'mentor-1' },
      error: null,
    });
    const agent = new ReviewAgent();

    await agent.approveReview('review-1', 'admin-1');

    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: 'APX-09',
        event: 'EXPERT_REVIEW_APPROVED',
      }),
    );
    expect(mockRevalidateExpertReviews).toHaveBeenCalledWith('mentor-1');
  });

  it('rejects LLM moderation when allowed is not strictly true', async () => {
    mockCallLlmWithBackoff.mockResolvedValueOnce({
      allowed: 'false',
      reason: 'Looks fine',
      quote_safe: true,
      display_name_safe: true,
      recommended_display_name: 'Verified Astro-Link user',
      policy_flags: [],
    });
    const agent = new ReviewAgent();

    await expect(
      agent.submitReview({
        bookingId,
        reviewerUserId: 'mentee-1',
        rating: 5,
        quote: 'This session was extremely helpful and actionable.',
        displayName: 'Verified Astro-Link user',
        attributionType: 'anonymous',
        consentToPublish: true,
      }),
    ).rejects.toThrow('Review failed moderation');
    expect(mockReviewInsert).not.toHaveBeenCalled();
  });
});
