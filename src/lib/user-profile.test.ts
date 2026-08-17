import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    })),
  },
}));

import { getMenteeProfile, updateMenteeProfile, updatePreferredLocale } from '@/lib/user-profile';

describe('user-profile preferred_locale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('updates preferred_locale alone and returns the saved tag', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { preferred_locale: 'ja' },
      error: null,
    });

    await expect(updatePreferredLocale('user-1', 'ja')).resolves.toBe('ja');
  });

  it('returns the requested locale when the row stores an unsupported tag', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { preferred_locale: 'de' },
      error: null,
    });

    await expect(updatePreferredLocale('user-1', 'fr')).resolves.toBe('fr');
  });

  it('returns null when preferred_locale cannot be saved', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'update failed' },
    });

    await expect(updatePreferredLocale('user-1', 'es')).resolves.toBeNull();
  });
});
