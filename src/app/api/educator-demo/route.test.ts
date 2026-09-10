import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({ insert: mockInsert }),
  },
}));

vi.mock('@/lib/email/resend-client', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { GET, POST } from './route';
import { __resetEducatorDemoRateLimitForTests } from '@/lib/educators/rate-limit';

const validBody = {
  fullName: 'Ada Lovelace',
  email: 'ada@school.edu',
  schoolName: 'Lincoln High',
  role: 'Teacher' as const,
};

function post(body: unknown, headers?: HeadersInit) {
  return POST(
    new Request('http://localhost/api/educator-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/educator-demo', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockSendEmail.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    __resetEducatorDemoRateLimitForTests();
    delete process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE;
    delete process.env.EDUCATOR_LEADS_EMAIL;
  });

  afterEach(() => {
    __resetEducatorDemoRateLimitForTests();
    delete process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE;
    delete process.env.EDUCATOR_LEADS_EMAIL;
  });

  it('stores a valid request', async () => {
    const res = await post(validBody);
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('returns 429 when the IP limit is exceeded', async () => {
    process.env.EDUCATOR_DEMO_MAX_PER_IP_MINUTE = '1';
    const headers = { 'x-forwarded-for': '203.0.113.9' };

    const first = await post(validBody, headers);
    expect(first.status).toBe(200);

    const second = await post({ ...validBody, email: 'other@school.edu' }, headers);
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).toBeTruthy();
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/educator-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid request body.' });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 400 with fieldErrors for invalid schema', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Check the highlighted fields.');
    expect(json.fieldErrors).toBeTruthy();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 500 when insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'db down' } });
    const res = await post(validBody);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      error: 'Something went wrong. Try again.',
    });
  });

  it('fires sales email after a successful insert', async () => {
    process.env.EDUCATOR_LEADS_EMAIL = 'sales@astrolink.ai';
    const res = await post(validBody);
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sales@astrolink.ai',
          subject: expect.stringContaining('Lincoln High'),
        }),
      );
    });
  });

  it('returns 405 for GET', async () => {
    const res = GET();
    expect(res.status).toBe(405);
  });
});
