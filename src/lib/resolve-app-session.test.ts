import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());
const mockEnsureMenteeUserRow = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/lib/user-profile', () => ({
  ensureMenteeUserRow: (...args: unknown[]) => mockEnsureMenteeUserRow(...args),
}));

vi.mock('@/lib/app-mode', () => ({
  isAdminEmailAllowed: () => true,
}));

import { resolveAppSessionFromAuthUser } from '@/lib/resolve-app-session';

function chain(result: { data: unknown; error?: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  api.select = vi.fn(self);
  api.eq = vi.fn(self);
  api.maybeSingle = vi.fn(async () => result);
  api.single = vi.fn(async () => result);
  api.update = vi.fn(() => api);
  return api;
}

describe('resolveAppSessionFromAuthUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_EMAILS', '');
    mockEnsureMenteeUserRow.mockResolvedValue('public-user-id');
  });

  it('grants admin when user_app_state is keyed by public.users.id not auth id', async () => {
    const authId = '2b12926b-7ed3-4a8f-b6f9-0768672ad13a';
    const publicId = '88f2708e-b06b-4521-bb55-118e2861737b';

    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentors') {
        return chain({ data: null });
      }
      if (table === 'users') {
        // email lookup returns public row
        return chain({ data: { id: publicId } });
      }
      if (table === 'user_app_state') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => ({
              maybeSingle: vi.fn(async () => {
                if (col === 'user_id' && val === publicId) {
                  return { data: { role: 'admin', onboarded: true }, error: null };
                }
                return { data: null, error: null };
              }),
            })),
          })),
        };
      }
      return chain({ data: null });
    });

    const session = await resolveAppSessionFromAuthUser({
      id: authId,
      email: 'support@astro-link.space',
      user_metadata: { full_name: 'admin team' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    } as never);

    expect(session?.role).toBe('admin');
    expect(session?.email).toBe('support@astro-link.space');
    expect(mockEnsureMenteeUserRow).toHaveBeenCalled();
  });

  it('falls back to mentee when no admin app state exists', async () => {
    mockFrom.mockImplementation(() => chain({ data: null }));

    const session = await resolveAppSessionFromAuthUser({
      id: 'auth-uuid',
      email: 'buyer@example.com',
      user_metadata: { full_name: 'Buyer' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    } as never);

    expect(session?.role).toBe('mentee');
  });
});
