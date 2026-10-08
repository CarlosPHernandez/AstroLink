import { beforeEach, describe, expect, it, vi } from 'vitest';

const authenticateRequest = vi.hoisted(() => vi.fn());
const getUser = vi.hoisted(() => vi.fn());
const revokeSession = vi.hoisted(() => vi.fn());
const resolvePublicUserIdForAuthUser = vi.hoisted(() => vi.fn());
const resolveAppSessionFromAuthUser = vi.hoisted(() => vi.fn());
const insertAppState = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(async () => ({
    authenticateRequest,
    users: { getUser },
    sessions: { revokeSession },
  })),
}));

vi.mock('@/lib/resolve-app-session', () => ({
  resolvePublicUserIdForAuthUser,
  resolveAppSessionFromAuthUser,
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({ insert: insertAppState }),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ cookie: '__session=from-headers' })),
}));

import {
  accountIdForClerkIdentity,
  clerkDisplayName,
  clerkHeaderSourceFromRequest,
  resolveClerkAppSession,
  revokeClerkSession,
} from '@/lib/clerk-app-session';

const NIL_AUTH_ID = '00000000-0000-4000-8000-000000000000';

describe('clerk account bridge', () => {
  it('reuses an existing AstroLink user id', () => {
    expect(accountIdForClerkIdentity('88f2708e-b06b-4521-bb55-118e2861737b')).toBe(
      '88f2708e-b06b-4521-bb55-118e2861737b',
    );
  });

  it('mints a uuid instead of storing a Clerk user id', () => {
    const id = accountIdForClerkIdentity(null);
    expect(id).not.toMatch(/^user_/);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('builds a display name from Clerk profile fields', () => {
    expect(
      clerkDisplayName({ firstName: 'Ada', lastName: 'Lovelace', fullName: null }),
    ).toBe('Ada Lovelace');
    expect(clerkDisplayName({ fullName: 'Grace Hopper' })).toBe('Grace Hopper');
    expect(clerkDisplayName({ username: 'ghopper' })).toBe('ghopper');
    expect(clerkDisplayName({})).toBe('');
  });

  it('mints a uuid when the lookup id is the nil placeholder', () => {
    const id = accountIdForClerkIdentity(NIL_AUTH_ID);
    expect(id).not.toBe(NIL_AUTH_ID);
    expect(id).not.toMatch(/^user_/);
  });
});

describe('clerk request cookies', () => {
  it('sends the cookie jar even when the header list omits Cookie', () => {
    const source = clerkHeaderSourceFromRequest({
      url: 'https://astro-link.space/dashboard/mentor',
      headers: new Headers({ accept: 'text/html', cookie: 'ignored=1' }),
      cookies: {
        getAll: () => [{ name: '__session', value: 'sess-token' }],
      },
    });

    expect(source.cookieHeader).toBe('__session=sess-token');
    expect(source.url).toContain('/dashboard/mentor');
  });
});

describe('resolveClerkAppSession', () => {
  beforeEach(() => {
    authenticateRequest.mockReset();
    getUser.mockReset();
    revokeSession.mockReset();
    resolvePublicUserIdForAuthUser.mockReset();
    resolveAppSessionFromAuthUser.mockReset();
    insertAppState.mockReset();
  });

  it('returns null when Clerk has no session', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => null });

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '',
    });

    expect(session).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('returns null when the Clerk user has no primary email', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_abc' }) });
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idn_1',
      emailAddresses: [],
      firstName: 'Ada',
      lastName: null,
      fullName: null,
      username: null,
    });

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '__session=sess',
    });

    expect(session).toBeNull();
    expect(resolveAppSessionFromAuthUser).not.toHaveBeenCalled();
  });

  it('reuses the existing public user and ignores a duplicate mentee state row', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_abc' }) });
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idn_1',
      emailAddresses: [{ id: 'idn_1', emailAddress: 'Ada@Example.com' }],
      firstName: null,
      lastName: null,
      fullName: 'Ada Lovelace',
      username: 'ada',
    });
    resolvePublicUserIdForAuthUser.mockResolvedValue('88f2708e-b06b-4521-bb55-118e2861737b');
    resolveAppSessionFromAuthUser.mockImplementation(async (user: { id: string; email: string }) => ({
      userId: user.id,
      email: user.email,
      role: 'mentee' as const,
      fullName: 'Ada Lovelace',
      expiresAt: '2099-01-01T00:00:00.000Z',
      onboarded: true,
    }));
    insertAppState.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } });

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [['cookie', 'stale=1']],
      cookieHeader: '__session=sess',
    });

    expect(resolvePublicUserIdForAuthUser).toHaveBeenCalledWith({
      authUserId: NIL_AUTH_ID,
      email: 'ada@example.com',
    });
    expect(resolveAppSessionFromAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '88f2708e-b06b-4521-bb55-118e2861737b',
        email: 'ada@example.com',
        user_metadata: { full_name: 'Ada Lovelace' },
      }),
    );
    expect(session?.role).toBe('mentee');
    expect(insertAppState).toHaveBeenCalledWith({
      user_id: '88f2708e-b06b-4521-bb55-118e2861737b',
      role: 'mentee',
      onboarded: true,
    });
  });

  it('does not write mentee state for a claim-linked mentor', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_abc' }) });
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idn_1',
      emailAddresses: [{ id: 'idn_1', emailAddress: 'mentor@example.com' }],
      firstName: 'Chris',
      lastName: 'S',
      fullName: null,
      username: null,
    });
    resolvePublicUserIdForAuthUser.mockResolvedValue('88f2708e-b06b-4521-bb55-118e2861737b');
    resolveAppSessionFromAuthUser.mockResolvedValue({
      userId: 'mentor-row-id',
      email: 'mentor@example.com',
      role: 'mentor',
      fullName: 'Chris S',
      expiresAt: '2099-01-01T00:00:00.000Z',
      onboarded: true,
      activationStatus: 'active',
    });

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '__session=sess',
    });

    expect(session?.role).toBe('mentor');
    expect(session?.userId).toBe('mentor-row-id');
    expect(insertAppState).not.toHaveBeenCalled();
  });

  it('returns null when the account bridge returns no session', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_abc' }) });
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idn_1',
      emailAddresses: [{ id: 'idn_1', emailAddress: 'ada@example.com' }],
      firstName: 'Ada',
      lastName: null,
      fullName: null,
      username: null,
    });
    resolvePublicUserIdForAuthUser.mockResolvedValue(null);
    resolveAppSessionFromAuthUser.mockResolvedValue(null);

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '__session=sess',
    });

    expect(session).toBeNull();
    expect(insertAppState).not.toHaveBeenCalled();
  });

  it('still returns the mentee session when app-state insert fails for another reason', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => ({ userId: 'user_abc' }) });
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idn_1',
      emailAddresses: [{ id: 'idn_1', emailAddress: 'ada@example.com' }],
      firstName: 'Ada',
      lastName: null,
      fullName: null,
      username: null,
    });
    resolvePublicUserIdForAuthUser.mockResolvedValue(null);
    resolveAppSessionFromAuthUser.mockImplementation(async (user: { id: string; email: string }) => ({
      userId: user.id,
      email: user.email,
      role: 'mentee' as const,
      fullName: 'Ada',
      expiresAt: '2099-01-01T00:00:00.000Z',
      onboarded: true,
    }));
    insertAppState.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '__session=sess',
    });

    expect(session?.role).toBe('mentee');
    expect(session?.userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returns null when Clerk throws', async () => {
    authenticateRequest.mockRejectedValue(new Error('clerk unavailable\nstack'));

    const session = await resolveClerkAppSession({
      url: 'https://astro-link.space/',
      headerEntries: [],
      cookieHeader: '__session=sess',
    });

    expect(session).toBeNull();
  });
});

describe('revokeClerkSession', () => {
  beforeEach(() => {
    authenticateRequest.mockReset();
    revokeSession.mockReset();
  });

  it('revokes the current Clerk session', async () => {
    authenticateRequest.mockResolvedValue({
      toAuth: () => ({ sessionId: 'sess_123' }),
    });
    revokeSession.mockResolvedValue({});

    await expect(revokeClerkSession()).resolves.toBe(true);
    expect(revokeSession).toHaveBeenCalledWith('sess_123');
  });

  it('returns false when there is no Clerk session to revoke', async () => {
    authenticateRequest.mockResolvedValue({ toAuth: () => null });

    await expect(revokeClerkSession()).resolves.toBe(false);
    expect(revokeSession).not.toHaveBeenCalled();
  });

  it('returns false when revoke throws', async () => {
    authenticateRequest.mockRejectedValue(new Error('network down'));

    await expect(revokeClerkSession()).resolves.toBe(false);
  });
});
