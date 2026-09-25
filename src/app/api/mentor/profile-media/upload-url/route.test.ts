import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequire = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockCreateSignedUploadUrl = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mentor-activation/require-activated-mentor', () => ({
  requireActivatedMentor: () => mockRequire(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: () => ({
        createSignedUploadUrl: (...args: unknown[]) => mockCreateSignedUploadUrl(...args),
      }),
    },
  },
}));

import { resetProfileMediaRateLimit } from '@/lib/expert-profile-media';
import { POST } from './route';

const mentorId = 'a0000002-0000-4000-8000-000000000002';

function mentorLookup(slug: string) {
  mockFrom.mockImplementation((table: string) => {
    if (table !== 'mentors') throw new Error(table);
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { id: mentorId, slug }, error: null }),
        }),
      }),
    };
  });
}

describe('POST /api/mentor/profile-media/upload-url', () => {
  beforeEach(() => {
    mockRequire.mockReset();
    mockFrom.mockReset();
    mockCreateSignedUploadUrl.mockReset();
    resetProfileMediaRateLimit();
  });

  it('rejects a mentee', async () => {
    mockRequire.mockResolvedValue({ ok: false, message: 'You must be signed in as a mentor.' });
    const response = await POST(
      new Request('http://127.0.0.1/api/mentor/profile-media/upload-url', {
        method: 'POST',
        body: JSON.stringify({ kind: 'portrait', contentType: 'image/jpeg' }),
      }),
    );
    expect(response.status).toBe(401);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('signs the session slug portrait path', async () => {
    mockRequire.mockResolvedValue({
      ok: true,
      session: { userId: mentorId, role: 'mentor', email: 'avery@example.com', fullName: 'Avery Quinn' },
    });
    mentorLookup('avery-quinn');
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example/sign', token: 'tok' },
      error: null,
    });

    const response = await POST(
      new Request('http://127.0.0.1/api/mentor/profile-media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'portrait',
          contentType: 'image/jpeg',
          path: 'chris-sembroski/portrait.jpg',
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith('avery-quinn/portrait.jpg', { upsert: true });
  });
});
