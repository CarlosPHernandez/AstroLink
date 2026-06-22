import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

describe('POST /api/mentor/stripe-connect', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireApiRole.mockReset();
    vi.stubEnv('ENABLE_STRIPE_CONNECT_PAYOUTS', '');
  });

  it('returns 503 when Connect payouts are deferred', async () => {
    mockRequireApiRole.mockResolvedValue({
      userId: 'a0000002-0000-4000-8000-000000000002',
      role: 'mentor',
      email: 'chris@astrolink.ai',
      fullName: 'Chris Sembroski',
      onboarded: true,
    });

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
});