import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
const mockUpdateEq = vi.hoisted(() =>
  vi.fn(() => ({
    error: null,
    select: vi.fn(() => ({ single: mockSingle })),
  })),
);
const mockInsert = vi.hoisted(() => vi.fn(() => ({ error: null })));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      })),
      update: vi.fn(() => ({
        eq: mockUpdateEq,
      })),
      insert: mockInsert,
    })),
  },
}));

import { ensureMenteeUserRow, getMenteeProfile, updateMenteeProfile } from '@/lib/user-profile';

describe('user-profile preferred_locale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ error: null });
    mockUpdateEq.mockReturnValue({
      error: null,
      select: vi.fn(() => ({ single: mockSingle })),
    });
  });

  it('creates a UUID user id when insert id is not a UUID', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const id = await ensureMenteeUserRow({
      userId: 'usr-not-a-uuid',
      email: 'new@example.com',
      fullName: 'New User',
    });

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        email: 'new@example.com',
        full_name: 'New User',
      }),
    );
  });

  it('returns existing user id on email conflict', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'a0000001-0000-4000-8000-000000000001' },
      error: null,
    });

    const id = await ensureMenteeUserRow({
      userId: 'usr-not-a-uuid',
      email: 'carlos@astrolink.ai',
      fullName: 'Carlos Hernandez',
    });

    expect(id).toBe('a0000001-0000-4000-8000-000000000001');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns preferredLocale from users row', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'carlos@astrolink.ai',
        full_name: 'Carlos',
        phone: null,
        bio: '',
        preferred_locale: 'pt-BR',
        stripe_customer_id: null,
      },
      error: null,
    });

    const profile = await getMenteeProfile('user-1');
    expect(profile?.preferredLocale).toBe('pt-BR');
  });

  it('persists preferredLocale on profile update (D12)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'carlos@astrolink.ai',
        full_name: 'Carlos',
        phone: null,
        bio: 'bio',
        preferred_locale: 'es',
        stripe_customer_id: null,
      },
      error: null,
    });

    const profile = await updateMenteeProfile('user-1', {
      fullName: 'Carlos',
      email: 'carlos@astrolink.ai',
      phone: null,
      bio: 'bio',
      preferredLocale: 'es',
    });

    expect(profile?.preferredLocale).toBe('es');
  });
});
