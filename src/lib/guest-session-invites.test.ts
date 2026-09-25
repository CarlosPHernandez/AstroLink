import { describe, expect, it } from 'vitest';
import {
  claimDecision,
  generateGuestInviteToken,
  hashGuestInviteToken,
  normalizeInviteEmail,
  sessionWindowsOverlap,
} from '@/lib/guest-session-invites';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  token_hash: 'abc',
  email_lock: 'fan@example.com',
  mentor_id: '22222222-2222-4222-8222-222222222222',
  duration_minutes: 25,
  campaign_id: 'chris-sembroski',
  marketing_referrer: 'gtm-lockheed-comment-2026',
  status: 'available',
  expires_at: '2030-01-01T00:00:00.000Z',
  claimed_by_user_id: null,
  redeemed_booking_id: null,
};

describe('guest invite token', () => {
  it('hashes the same token to the same hex and never returns the raw token', () => {
    const token = generateGuestInviteToken();
    expect(token.length).toBeGreaterThan(40);
    expect(hashGuestInviteToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashGuestInviteToken(`  ${token}  `)).toBe(hashGuestInviteToken(token));
    expect(hashGuestInviteToken(token)).not.toContain(token);
  });
});

describe('claimDecision', () => {
  const now = new Date('2026-09-24T12:00:00.000Z');

  it('rejects a missing row, a revoked row, and an expired row', () => {
    expect(claimDecision({ row: null, email: 'fan@example.com', userId: 'u1', now }).action).toBe(
      'reject',
    );
    expect(
      claimDecision({
        row: { ...row, status: 'revoked' },
        email: 'fan@example.com',
        userId: 'u1',
        now,
      }),
    ).toMatchObject({ action: 'reject', code: 'revoked' });
    expect(
      claimDecision({
        row: { ...row, expires_at: '2020-01-01T00:00:00.000Z' },
        email: 'fan@example.com',
        userId: 'u1',
        now,
      }),
    ).toMatchObject({ action: 'reject', code: 'expired' });
  });

  it('rejects a different email without treating the invite as claimed', () => {
    expect(
      claimDecision({
        row,
        email: 'other@example.com',
        userId: 'u1',
        now,
      }),
    ).toMatchObject({ action: 'reject', code: 'email_mismatch' });
  });

  it('claims once for the locked email and is idempotent for the same user', () => {
    expect(
      claimDecision({
        row,
        email: ' Fan@Example.com ',
        userId: 'u1',
        now,
      }).action,
    ).toBe('claim');
    expect(normalizeInviteEmail(' Fan@Example.com ')).toBe('fan@example.com');
    expect(
      claimDecision({
        row: { ...row, status: 'claimed', claimed_by_user_id: 'u1' },
        email: 'fan@example.com',
        userId: 'u1',
        now,
      }).action,
    ).toBe('idempotent');
  });

  it('rejects a second person after claim or redeem', () => {
    expect(
      claimDecision({
        row: { ...row, status: 'claimed', claimed_by_user_id: 'u1' },
        email: 'fan@example.com',
        userId: 'u2',
        now,
      }),
    ).toMatchObject({ code: 'used' });
    expect(
      claimDecision({
        row: { ...row, status: 'redeemed', claimed_by_user_id: 'u1' },
        email: 'fan@example.com',
        userId: 'u1',
        now,
      }),
    ).toMatchObject({ code: 'used' });
  });
});

describe('sessionWindowsOverlap', () => {
  it('detects an overlap and allows a session that starts when the other ends', () => {
    expect(
      sessionWindowsOverlap(
        '2030-08-15T18:00:00.000Z',
        25,
        '2030-08-15T18:10:00.000Z',
        45,
      ),
    ).toBe(true);
    expect(
      sessionWindowsOverlap(
        '2030-08-15T18:00:00.000Z',
        25,
        '2030-08-15T18:25:00.000Z',
        45,
      ),
    ).toBe(false);
  });
});
