import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockSubmitReview = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/services/agents/review-agent', () => ({
  ReviewAgent: vi.fn(() => ({ submitReview: mockSubmitReview })),
}));

import { POST } from './route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/expert-reviews', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/expert-reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 'mentee-1',
      role: 'mentee',
    });
    mockSubmitReview.mockResolvedValue({
      reviewId: 'review-1',
      status: 'pending',
      autoPublished: false,
      moderationVerdict: 'flagged',
    });
  });

  it('creates a review for a signed-in mentee without exposing diagnosis', async () => {
    const res = await POST(
      makeRequest({
        bookingId: '7d787c79-7f66-4fde-b1db-1b8fe4b2f2f2',
        rating: 5,
        quote: 'The expert answered my questions clearly and I left with concrete next steps.',
        displayName: 'Verified Astro-Link user',
        attributionType: 'anonymous',
        consentToPublish: true,
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: {
        reviewId: 'review-1',
        status: 'pending',
        autoPublished: false,
      },
    });
    expect(mockSubmitReview).toHaveBeenCalledWith({
      bookingId: '7d787c79-7f66-4fde-b1db-1b8fe4b2f2f2',
      reviewerUserId: 'mentee-1',
      rating: 5,
      quote: 'The expert answered my questions clearly and I left with concrete next steps.',
      displayName: 'Verified Astro-Link user',
      attributionType: 'anonymous',
      consentToPublish: true,
      source: 'post_session_survey',
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: 'Sign in as a buyer to leave feedback.',
    });
  });
});
