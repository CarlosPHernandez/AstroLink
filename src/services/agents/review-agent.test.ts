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
  callLlmWithBackoff: (fn: () => Promise<unknown>) => mockCallLlmWithBackoff(fn),
  generateStructuredJson: vi.fn(),
  llmFlashModel: 'test-model',
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

import { isAutoPublishEligible, ReviewAgent } from '@/services/agents/review-agent';

const bookingId = 'booking-0000-0000-0000-000000000001';

const clearModeration = {
  verdict: 'clear',
  reason: 'Safe to publish',
  quote_safe: true,
  display_name_safe: true,
  recommended_display_name: 'Verified Astro-Link user',
  policy_flags: [] as string[],
};

describe('isAutoPublishEligible', () => {
  it('requires consent and clear safe screens', () => {
    expect(isAutoPublishEligible(clearModeration, true)).toBe(true);
    expect(isAutoPublishEligible(clearModeration, false)).toBe(false);
    expect(
      isAutoPublishEligible({ ...clearModeration, verdict: 'flagged' }, true),
    ).toBe(false);
    expect(
      isAutoPublishEligible(
        { ...clearModeration, policy_flags: ['pii'] },
        true,
      ),
    ).toBe(false);
  });
});

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
    mockCallLlmWithBackoff.mockImplementation(async (fn: () => Promise<unknown>) => {
      if (typeof fn === 'function') {
        // screenReview passes a thunk that calls generateStructuredJson;
        // we short-circuit the whole callLlmWithBackoff result.
      }
      return clearModeration;
    });
  });

  it('creates a review and auto-publishes when clear + consent', async () => {
    const agent = new ReviewAgent();

    const result = await agent.submitReview({
      bookingId,
      reviewerUserId: 'mentee-1',
      rating: 5,
      quote: 'This session was extremely helpful and actionable.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: true,
    });

    expect(result).toEqual({
      reviewId: 'review-1',
      status: 'approved',
      autoPublished: true,
      moderationVerdict: 'clear',
    });
    expect(mockReviewInsert).toHaveBeenCalled();
    expect(mockRevalidateExpertReviews).toHaveBeenCalledWith('mentor-1');
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: 'APX-09',
        event: 'EXPERT_REVIEW_SUBMITTED',
      }),
    );
  });

  it('still stores flagged reviews as pending (does not block mentee)', async () => {
    mockCallLlmWithBackoff.mockResolvedValueOnce({
      verdict: 'flagged',
      reason: 'Possible PII in quote',
      quote_safe: false,
      display_name_safe: true,
      recommended_display_name: 'Verified Astro-Link user',
      policy_flags: ['pii'],
    });

    const agent = new ReviewAgent();
    const result = await agent.submitReview({
      bookingId,
      reviewerUserId: 'mentee-1',
      rating: 2,
      quote: 'This session was extremely helpful and actionable.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: true,
    });

    expect(result.status).toBe('pending');
    expect(result.autoPublished).toBe(false);
    expect(result.moderationVerdict).toBe('flagged');
    expect(mockReviewInsert).toHaveBeenCalled();
    expect(mockRevalidateExpertReviews).not.toHaveBeenCalled();
  });

  it('keeps clear reviews pending when consent is false', async () => {
    const agent = new ReviewAgent();
    const result = await agent.submitReview({
      bookingId,
      reviewerUserId: 'mentee-1',
      rating: 5,
      quote: 'This session was extremely helpful and actionable.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: false,
    });

    expect(result.status).toBe('pending');
    expect(result.autoPublished).toBe(false);
    expect(mockReviewInsert).toHaveBeenCalled();
  });

  it('stores as pending with error verdict when LLM fails', async () => {
    mockCallLlmWithBackoff.mockRejectedValueOnce(new Error('quota'));

    const agent = new ReviewAgent();
    const result = await agent.submitReview({
      bookingId,
      reviewerUserId: 'mentee-1',
      rating: 5,
      quote: 'This session was extremely helpful and actionable.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: true,
    });

    expect(result.status).toBe('pending');
    expect(result.moderationVerdict).toBe('error');
    expect(mockReviewInsert).toHaveBeenCalled();
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
});
