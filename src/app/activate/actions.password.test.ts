import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockIsSupabaseAuthEnabled = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
  createSession: vi.fn(),
  isUsingDemoSessionCookie: vi.fn(() => false),
}));

vi.mock('@/lib/app-mode', () => ({
  isSupabaseAuthEnabled: () => mockIsSupabaseAuthEnabled(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
    auth: { admin: { createUser: vi.fn(), generateLink: vi.fn() } },
  },
}));

vi.mock('@/lib/revalidate-mentors', () => ({
  revalidateMentorDirectory: vi.fn(),
}));

vi.mock('@/lib/mentor-activation/claim', () => ({
  completeMentorActivation: vi.fn(),
  getMentorActivationRow: vi.fn(),
  linkMentorClaim: vi.fn(),
  loadValidClaimToken: vi.fn(),
  MentorClaimError: class MentorClaimError extends Error {},
}));

import { setActivationPasswordAction } from './actions';

const mentorSession = {
  userId: 'a0000002-0000-4000-8000-000000000002',
  email: 'chris@astrolink.ai',
  role: 'mentor' as const,
  fullName: 'Chris Sembroski',
  onboarded: true,
  activationStatus: 'pending' as const,
};

function passwordForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set('password', overrides.password ?? 'newpassword');
  formData.set('confirmPassword', overrides.confirmPassword ?? 'newpassword');
  return formData;
}

describe('setActivationPasswordAction', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockIsSupabaseAuthEnabled.mockReset();
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockIsSupabaseAuthEnabled.mockReturnValue(true);
  });

  it('rejects non-mentor sessions', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await setActivationPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/signed in as a mentor/i);
  });

  it('skips Auth update in demo mode', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockIsSupabaseAuthEnabled.mockReturnValue(false);
    const result = await setActivationPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/demo auth/i);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('returns Zod errors for mismatched passwords', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const result = await setActivationPasswordAction(
      undefined,
      passwordForm({ confirmPassword: 'different1' }),
    );
    expect(result.success).toBe(false);
    expect(result.errors?.confirmPassword?.[0]).toMatch(/do not match/i);
  });

  it('fails when Auth session is missing', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await setActivationPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/session expired/i);
  });

  it('sets password via updateUser', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-1', email: mentorSession.email } } });
    mockUpdateUser.mockResolvedValue({ error: null });
    const result = await setActivationPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' });
  });

  it('surfaces Auth update failures', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-1', email: mentorSession.email } } });
    mockUpdateUser.mockResolvedValue({ error: { message: 'Weak password' } });
    const result = await setActivationPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/could not set password/i);
  });
});
