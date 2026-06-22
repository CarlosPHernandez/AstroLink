import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockGetMentorStripeRow = vi.hoisted(() => vi.fn());
const mockCreateMentorOnboardingLink = vi.hoisted(() => vi.fn());
const mockCreateMentorExpressDashboardLink = vi.hoisted(() => vi.fn());
const mockIsStripePaymentsSkipped = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/booking-payments', () => ({
  isStripePaymentsSkipped: () => mockIsStripePaymentsSkipped(),
}));

vi.mock('@/lib/mentor-stripe-connect', () => ({
  getMentorStripeRow: (...args: unknown[]) => mockGetMentorStripeRow(...args),
  createMentorOnboardingLink: (...args: unknown[]) => mockCreateMentorOnboardingLink(...args),
  createMentorExpressDashboardLink: (...args: unknown[]) =>
    mockCreateMentorExpressDashboardLink(...args),
}));

const mentorSession = {
  userId: 'a0000002-0000-4000-8000-000000000002',
  role: 'mentor' as const,
  email: 'chris@astrolink.ai',
  fullName: 'Chris Sembroski',
  onboarded: true,
};

const mentorRow = {
  email: 'chris@astrolink.ai',
  full_name: 'Chris Sembroski',
  stripe_connect_account_id: 'acct_test_123',
  stripe_onboarding_completed: false,
  compliance_status: 'approved' as const,
};

describe('POST /api/mentor/stripe-connect', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireApiRole.mockReset();
    mockGetMentorStripeRow.mockReset();
    mockCreateMentorOnboardingLink.mockReset();
    mockCreateMentorExpressDashboardLink.mockReset();
    mockIsStripePaymentsSkipped.mockReturnValue(false);
    vi.stubEnv('ENABLE_STRIPE_CONNECT_PAYOUTS', '');
  });

  it('returns 503 when Connect payouts are deferred', async () => {
    mockRequireApiRole.mockResolvedValue(mentorSession);

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'onboard' }),
      }),
    );

    expect(response.status).toBe(503);
    const json = (await response.json()) as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toContain('deferred');
  });

  it('returns auth response when session is missing', async () => {
    const unauthorized = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
    mockRequireApiRole.mockResolvedValue(unauthorized);

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', { method: 'POST' }),
    );

    expect(response.status).toBe(401);
  });

  describe('when ENABLE_STRIPE_CONNECT_PAYOUTS is true', () => {
    beforeEach(() => {
      vi.stubEnv('ENABLE_STRIPE_CONNECT_PAYOUTS', 'true');
      mockRequireApiRole.mockResolvedValue(mentorSession);
    });

    it('returns dev_skip when SKIP_STRIPE_PAYMENTS is active', async () => {
      mockIsStripePaymentsSkipped.mockReturnValue(true);

      const { POST } = await import('./route');
      const response = await POST(
        new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'onboard' }),
        }),
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as {
        success: boolean;
        data: { mode: string; message: string };
      };
      expect(json.success).toBe(true);
      expect(json.data.mode).toBe('dev_skip');
      expect(mockGetMentorStripeRow).not.toHaveBeenCalled();
    });

    it('returns onboarding link for onboard action', async () => {
      mockGetMentorStripeRow.mockResolvedValue(mentorRow);
      mockCreateMentorOnboardingLink.mockResolvedValue({
        url: 'https://connect.stripe.com/onboard',
        accountId: 'acct_new_456',
      });

      const { POST } = await import('./route');
      const response = await POST(
        new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'onboard' }),
        }),
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as {
        success: boolean;
        data: { mode: string; url: string; accountId: string };
      };
      expect(json.data).toEqual({
        mode: 'onboard',
        url: 'https://connect.stripe.com/onboard',
        accountId: 'acct_new_456',
      });
    });

    it('returns dashboard login link for dashboard action', async () => {
      mockGetMentorStripeRow.mockResolvedValue(mentorRow);
      mockCreateMentorExpressDashboardLink.mockResolvedValue('https://connect.stripe.com/login');

      const { POST } = await import('./route');
      const response = await POST(
        new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dashboard' }),
        }),
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as {
        success: boolean;
        data: { mode: string; url: string };
      };
      expect(json.data).toEqual({
        mode: 'dashboard',
        url: 'https://connect.stripe.com/login',
      });
    });

    it('returns 400 when mentor row is missing', async () => {
      mockGetMentorStripeRow.mockResolvedValue(null);

      const { POST } = await import('./route');
      const response = await POST(
        new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'onboard' }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 when dashboard is requested without a Connect account', async () => {
      mockGetMentorStripeRow.mockResolvedValue(mentorRow);
      mockCreateMentorExpressDashboardLink.mockResolvedValue(null);

      const { POST } = await import('./route');
      const response = await POST(
        new Request('http://127.0.0.1:3000/api/mentor/stripe-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dashboard' }),
        }),
      );

      expect(response.status).toBe(400);
      const json = (await response.json()) as { error: string };
      expect(json.error).toContain('Connect a bank account');
    });
  });
});