import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockUpdatePreferredLocale = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/user-profile', () => ({
  updatePreferredLocale: (...args: unknown[]) => mockUpdatePreferredLocale(...args),
}));

import { POST } from './route';

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/me/preferred-locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/me/preferred-locale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 'mentee-1', role: 'mentee' });
    mockUpdatePreferredLocale.mockResolvedValue('es');
  });

  it('saves a supported locale for the mentee', async () => {
    const res = await post({ locale: 'es' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ locale: 'es' });
    expect(mockUpdatePreferredLocale).toHaveBeenCalledWith('mentee-1', 'es');
  });

  it('rejects mentors', async () => {
    mockGetSession.mockResolvedValue({ userId: 'mentor-1', role: 'mentor' });
    const res = await post({ locale: 'es' });
    expect(res.status).toBe(403);
  });

  it('rejects unsupported locales', async () => {
    const res = await post({ locale: 'de' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await post({ locale: 'es' });
    expect(res.status).toBe(401);
    expect(mockUpdatePreferredLocale).not.toHaveBeenCalled();
  });

  it('rejects admins the same as other non-buyers', async () => {
    mockGetSession.mockResolvedValueOnce({ userId: 'admin-1', role: 'admin' });
    const res = await post({ locale: 'es' });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/me/preferred-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid JSON body' });
  });

  it('returns 500 when the profile update fails', async () => {
    mockUpdatePreferredLocale.mockResolvedValueOnce(null);
    const res = await post({ locale: 'fr' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Could not save language.' });
  });
});
