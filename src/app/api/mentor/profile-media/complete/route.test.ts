import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequire = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mentor-activation/require-activated-mentor', () => ({
  requireActivatedMentor: () => mockRequire(),
}));

vi.mock('@/lib/revalidate-mentors', () => ({
  revalidateMentorDirectory: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: () => ({
        list: async () => ({ data: [{ name: 'portrait.jpg', metadata: { size: 120 } }], error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example/expert-intro-videos/${path}` },
        }),
        remove: (...args: unknown[]) => mockRemove(...args),
      }),
    },
  },
}));

import { POST } from './route';

const mentorId = 'a0000002-0000-4000-8000-000000000002';

describe('POST /api/mentor/profile-media/complete', () => {
  beforeEach(() => {
    mockRequire.mockReset();
    mockFrom.mockReset();
    mockRemove.mockReset();
    mockUpdate.mockReset();
    mockRequire.mockResolvedValue({
      ok: true,
      session: { userId: mentorId, role: 'mentor', email: 'avery@example.com', fullName: 'Avery Quinn' },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'mentors') throw new Error(table);
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: mentorId, slug: 'avery-quinn' }, error: null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => {
          mockUpdate(patch);
          return { eq: async () => ({ error: null }) };
        },
      };
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 206,
        arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer,
      })),
    );
  });

  it('rejects another expert path and does not update the row', async () => {
    const response = await POST(
      new Request('http://127.0.0.1/api/mentor/profile-media/complete', {
        method: 'POST',
        body: JSON.stringify({ kind: 'portrait', path: 'other-slug/portrait.jpg' }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('saves image_url and does not touch is_listed', async () => {
    const response = await POST(
      new Request('http://127.0.0.1/api/mentor/profile-media/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'portrait', path: 'avery-quinn/portrait.jpg' }),
      }),
    );
    expect(response.status).toBe(200);
    const patch = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(String(patch.image_url)).toContain('avery-quinn/portrait.jpg?v=');
    expect(patch).not.toHaveProperty('is_listed');
  });

  it('deletes a file whose header is not an image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new TextEncoder().encode('<svg').buffer,
      })),
    );
    const response = await POST(
      new Request('http://127.0.0.1/api/mentor/profile-media/complete', {
        method: 'POST',
        body: JSON.stringify({ kind: 'portrait', path: 'avery-quinn/portrait.jpg' }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mockRemove).toHaveBeenCalledWith(['avery-quinn/portrait.jpg']);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
