import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSubmit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/expert-offer/applications', () => ({
  submitExpertApplication: (...args: unknown[]) => mockSubmit(...args),
}));

import { POST, __resetExpertApplicationRateLimitForTests } from './route';

const validBody = {
  fullName: 'Avery Quinn',
  email: 'avery@example.com',
  employer: 'JSC',
  expertise: 'Guidance, navigation',
  bio: 'Ten years on crewed vehicle guidance.',
  hourlyRateDollars: 150,
  services: ['session_1on1'],
  videoRequest: { enabled: false },
  timezone: 'America/Chicago',
  windows: [{ weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 }],
  isCivilServant: false,
};

function post(body: unknown, headers?: HeadersInit) {
  return POST(
    new Request('http://localhost/api/expert-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

describe('POST /api/expert-applications', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    mockSubmit.mockResolvedValue({ id: 'new-id', created: true });
    __resetExpertApplicationRateLimitForTests();
    vi.useRealTimers();
  });

  afterEach(() => {
    __resetExpertApplicationRateLimitForTests();
    vi.useRealTimers();
  });

  it('returns 201 without an id and calls submit once', async () => {
    const res = await post(validBody, { 'x-forwarded-for': '203.0.113.10' });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'avery@example.com',
        hourlyRateDollars: 150,
        fullName: 'Avery Quinn',
      }),
    );
  });

  it('returns 200 without an id when the email is already submitted', async () => {
    mockSubmit.mockResolvedValue({ id: 'existing-id', created: false });

    const res = await post(validBody, { 'x-forwarded-for': '203.0.113.11' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an hourly rate of 0 and does not submit', async () => {
    const res = await post(
      { ...validBody, hourlyRateDollars: 0 },
      { 'x-forwarded-for': '203.0.113.12' },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: 'Check the highlighted fields.',
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON and does not submit', async () => {
    const res = await post('not-json', { 'x-forwarded-for': '203.0.113.13' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: 'Check the highlighted fields.',
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('returns 500 when submit fails', async () => {
    mockSubmit.mockRejectedValue(new Error('db down'));

    const res = await post(validBody, { 'x-forwarded-for': '203.0.113.14' });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      success: false,
      error: 'Could not submit. Try again.',
    });
  });

  it('returns 429 after 5 posts in 10 minutes for the first forwarded hop', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.9, 10.0.0.8' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await post(validBody, headers);
      expect(res.status).toBe(201);
    }

    const blocked = await post(validBody, headers);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      success: false,
      error: 'Too many applications. Try again later.',
    });
    expect(mockSubmit).toHaveBeenCalledTimes(5);

    const otherIp = await post(validBody, { 'x-forwarded-for': '198.51.100.4' });
    expect(otherIp.status).toBe(201);
  });

  it('shares one bucket when x-forwarded-for is missing and opens it after 10 minutes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T12:00:00.000Z'));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await post(validBody);
      expect(res.status).toBe(201);
    }

    const blocked = await post(validBody);
    expect(blocked.status).toBe(429);

    vi.setSystemTime(new Date('2026-09-24T12:10:00.000Z'));
    const again = await post(validBody);
    expect(again.status).toBe(201);
  });
});
