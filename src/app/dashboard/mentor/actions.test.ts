import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NF1860_MAX_BYTES } from '@/lib/nf1860-upload';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockUpdateMentorProfile = vi.hoisted(() => vi.fn());
const mockGetMentorProfileRow = vi.hoisted(() => vi.fn());
const mockRecordMentorNf1860Upload = vi.hoisted(() => vi.fn());
const mockIsSupabaseAuthEnabled = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/app-mode', () => ({
  isSupabaseAuthEnabled: () => mockIsSupabaseAuthEnabled(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: () => mockGetUser(),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  }),
}));

vi.mock('@/lib/mentor-profile', () => ({
  updateMentorProfile: (...args: unknown[]) => mockUpdateMentorProfile(...args),
  getMentorProfileRow: (...args: unknown[]) => mockGetMentorProfileRow(...args),
  recordMentorNf1860Upload: (...args: unknown[]) => mockRecordMentorNf1860Upload(...args),
}));

import {
  changeMentorPasswordAction,
  updateMentorProfileAction,
  uploadMentorNf1860Action,
} from './actions';

const mentorSession = {
  userId: 'a0000002-0000-4000-8000-000000000002',
  email: 'chris@astrolink.ai',
  role: 'mentor' as const,
  fullName: 'Chris Sembroski',
  onboarded: true,
  activationStatus: 'active' as const,
};

function profileForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set('rate', overrides.rate ?? '250');
  formData.set('employer', overrides.employer ?? 'Blue Origin');
  formData.set('expertise', overrides.expertise ?? 'Human spaceflight');
  formData.set('bio', overrides.bio ?? 'Former Inspiration4 astronaut with mission operations experience.');
  if (overrides.isCivilServant) {
    formData.set('isCivilServant', 'on');
  }
  return formData;
}

describe('updateMentorProfileAction', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockUpdateMentorProfile.mockReset();
    mockGetMentorProfileRow.mockReset();
  });

  it('rejects unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updateMentorProfileAction(undefined, profileForm());
    expect(result.success).toBe(false);
    expect(result.message).toContain('signed in as a mentor');
  });

  it('rejects non-mentor roles', async () => {
    mockGetSession.mockResolvedValue({ ...mentorSession, role: 'mentee' });
    const result = await updateMentorProfileAction(undefined, profileForm());
    expect(result.success).toBe(false);
  });

  it('returns Zod errors for invalid rate', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const result = await updateMentorProfileAction(undefined, profileForm({ rate: '0' }));
    expect(result.success).toBe(false);
    expect(result.errors?.rate?.[0]).toBeTruthy();
  });

  it('rejects empty expertise after parsing', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const result = await updateMentorProfileAction(
      undefined,
      profileForm({ expertise: ' , , ' }),
    );
    expect(result.success).toBe(false);
    expect(result.errors?.expertise?.[0]).toMatch(/expertise/i);
  });

  it('saves a valid profile', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockUpdateMentorProfile.mockResolvedValue({ fullName: 'Chris Sembroski' });
    const result = await updateMentorProfileAction(undefined, profileForm());
    expect(result.success).toBe(true);
    expect(mockUpdateMentorProfile).toHaveBeenCalledWith(
      mentorSession.userId,
      expect.objectContaining({
        liveSessionPriceCents: 25000,
        employer: 'Blue Origin',
      }),
    );
  });
});

describe('uploadMentorNf1860Action', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockRecordMentorNf1860Upload.mockReset();
  });

  it('rejects non-PDF files', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const formData = new FormData();
    formData.set('file', new File(['notes'], 'notes.txt', { type: 'text/plain' }));
    const result = await uploadMentorNf1860Action(undefined, formData);
    expect(result.success).toBe(false);
    expect(result.errors?.file?.[0]).toContain('PDF');
  });

  it('rejects PDF with invalid magic bytes', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const formData = new FormData();
    formData.set('file', new File(['not pdf'], 'fake.pdf', { type: 'application/pdf' }));
    const result = await uploadMentorNf1860Action(undefined, formData);
    expect(result.success).toBe(false);
    expect(result.errors?.file?.[0]).toContain('PDF');
  });

  it('rejects oversized PDF before upload', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const oversized = new Uint8Array(NF1860_MAX_BYTES + 1);
    oversized.set([0x25, 0x50, 0x44, 0x46]); // %PDF
    const formData = new FormData();
    formData.set(
      'file',
      new File([oversized], 'large.pdf', { type: 'application/pdf' }),
    );
    const result = await uploadMentorNf1860Action(undefined, formData);
    expect(result.success).toBe(false);
    expect(result.errors?.file?.[0]).toContain('10 MB');
    expect(mockRecordMentorNf1860Upload).not.toHaveBeenCalled();
  });

  it('uploads a valid minimal PDF', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockRecordMentorNf1860Upload.mockResolvedValue({ complianceStatus: 'awaiting_human_approval' });
    const formData = new FormData();
    formData.set(
      'file',
      new File(['%PDF-1.0\n%%EOF\n'], 'nf1860.pdf', { type: 'application/pdf' }),
    );
    const result = await uploadMentorNf1860Action(undefined, formData);
    expect(result.success).toBe(true);
    expect(mockRecordMentorNf1860Upload).toHaveBeenCalledOnce();
  });
});

function passwordForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set('currentPassword', overrides.currentPassword ?? 'oldpassword');
  formData.set('password', overrides.password ?? 'newpassword');
  formData.set('confirmPassword', overrides.confirmPassword ?? 'newpassword');
  return formData;
}

describe('changeMentorPasswordAction', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockIsSupabaseAuthEnabled.mockReset();
    mockGetUser.mockReset();
    mockSignInWithPassword.mockReset();
    mockUpdateUser.mockReset();
    mockIsSupabaseAuthEnabled.mockReturnValue(true);
  });

  it('rejects unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await changeMentorPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.message).toContain('signed in as a mentor');
  });

  it('rejects pending activation', async () => {
    mockGetSession.mockResolvedValue({ ...mentorSession, activationStatus: 'pending' });
    const result = await changeMentorPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/activation/i);
  });

  it('returns Zod errors for mismatched passwords', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    const result = await changeMentorPasswordAction(
      undefined,
      passwordForm({ confirmPassword: 'different1' }),
    );
    expect(result.success).toBe(false);
    expect(result.errors?.confirmPassword?.[0]).toMatch(/do not match/i);
  });

  it('rejects incorrect current password', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockGetUser.mockResolvedValue({ data: { user: { email: mentorSession.email } } });
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login' } });
    const result = await changeMentorPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(false);
    expect(result.errors?.currentPassword?.[0]).toMatch(/incorrect/i);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('updates password when current password is valid', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockGetUser.mockResolvedValue({ data: { user: { email: mentorSession.email } } });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    const result = await changeMentorPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(true);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: mentorSession.email,
      password: 'oldpassword',
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' });
  });

  it('skips Auth update in demo mode', async () => {
    mockGetSession.mockResolvedValue(mentorSession);
    mockIsSupabaseAuthEnabled.mockReturnValue(false);
    const result = await changeMentorPasswordAction(undefined, passwordForm());
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/demo auth/i);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});