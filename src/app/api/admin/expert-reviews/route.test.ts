import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockReviewSelect = vi.hoisted(() => vi.fn());
const mockOrder = vi.hoisted(() => vi.fn());
const mockApproveReview = vi.hoisted(() => vi.fn());
const mockHideReview = vi.hoisted(() => vi.fn());
const mockWithdrawReview = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: () => mockRequireApiRole(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: mockOrder,
        })),
      })),
    })),
  },
}));

vi.mock('@/services/agents/review-agent', () => ({
  ReviewAgent: vi.fn(() => ({
    approveReview: mockApproveReview,
    hideReview: mockHideReview,
    withdrawReview: mockWithdrawReview,
  })),
}));

import { GET, POST } from './route';

function makeRequest(body?: Record<string, unknown>, query?: string) {
  return new Request(`http://localhost/api/admin/expert-reviews${query ? `?${query}` : ''}`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('/api/admin/expert-reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    mockOrder.mockResolvedValue({ data: [{ id: 'review-1', status: 'pending' }], error: null });
    mockApproveReview.mockResolvedValue(undefined);
    mockHideReview.mockResolvedValue(undefined);
    mockWithdrawReview.mockResolvedValue(undefined);
  });

  it('returns pending reviews by default', async () => {
    const res = await GET(new Request('http://localhost/api/admin/expert-reviews'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, reviews: [{ id: 'review-1', status: 'pending' }] });
  });

  it('approves a review', async () => {
    const res = await POST(
      makeRequest({ reviewId: '00000000-0000-4000-8000-000000000001', action: 'approve' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      reviewId: '00000000-0000-4000-8000-000000000001',
      status: 'approve',
    });
    expect(mockApproveReview).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', 'admin-1');
  });

  it('hides a review', async () => {
    const res = await POST(
      makeRequest({ reviewId: '00000000-0000-4000-8000-000000000002', action: 'hide' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      reviewId: '00000000-0000-4000-8000-000000000002',
      status: 'hide',
    });
    expect(mockHideReview).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000002', 'admin-1');
  });

  it('withdraws a review', async () => {
    const res = await POST(
      makeRequest({ reviewId: '00000000-0000-4000-8000-000000000003', action: 'withdraw' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      reviewId: '00000000-0000-4000-8000-000000000003',
      status: 'withdraw',
    });
    expect(mockWithdrawReview).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000003', 'admin-1');
  });
});
