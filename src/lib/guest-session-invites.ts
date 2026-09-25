import 'server-only';

import crypto from 'crypto';

import { GUEST_INVITE_DURATION_MINUTES } from '@/lib/guest-invite-constants';
import { supabaseAdmin } from '@/lib/supabase';

export {
  GUEST_INVITE_CAMPAIGN_ID,
  GUEST_INVITE_DURATION_MINUTES,
  GUEST_INVITE_REFERRER,
} from '@/lib/guest-invite-constants';

export const GUEST_INVITE_DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const OCCUPIED_BOOKING_STATUSES = ['pending_payment', 'confirmed', 'completed'] as const;

export type GuestInviteStatus = 'available' | 'claimed' | 'redeemed' | 'revoked';

export type GuestInviteClaimCode =
  | 'invalid'
  | 'expired'
  | 'email_mismatch'
  | 'used'
  | 'revoked';

export class GuestInviteClaimError extends Error {
  readonly code: GuestInviteClaimCode;

  constructor(code: GuestInviteClaimCode, message: string) {
    super(message);
    this.name = 'GuestInviteClaimError';
    this.code = code;
  }
}

type InviteRow = {
  id: string;
  token_hash: string;
  email_lock: string;
  mentor_id: string;
  duration_minutes: number;
  campaign_id: string;
  marketing_referrer: string;
  status: string;
  expires_at: string;
  claimed_by_user_id: string | null;
  redeemed_booking_id: string | null;
};

export type ClaimedGuestInvite = {
  id: string;
  mentorId: string;
  durationMinutes: number;
  campaignId: string;
  marketingReferrer: string;
  expiresAt: string;
  emailLock: string;
};

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateGuestInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashGuestInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function sessionWindowsOverlap(
  aStartIso: string,
  aMinutes: number,
  bStartIso: string,
  bMinutes: number,
): boolean {
  const a0 = Date.parse(aStartIso);
  const b0 = Date.parse(bStartIso);
  if (!Number.isFinite(a0) || !Number.isFinite(b0)) return false;
  if (aMinutes <= 0 || bMinutes <= 0) return false;
  const a1 = a0 + aMinutes * 60_000;
  const b1 = b0 + bMinutes * 60_000;
  return a0 < b1 && b0 < a1;
}

export function claimDecision(params: {
  row: InviteRow | null;
  email: string;
  userId: string;
  now?: Date;
}):
  | { action: 'claim' }
  | { action: 'idempotent' }
  | { action: 'reject'; code: GuestInviteClaimCode; message: string } {
  const now = params.now ?? new Date();
  const row = params.row;
  if (!row) {
    return { action: 'reject', code: 'invalid', message: 'This link is not valid.' };
  }
  if (row.status === 'revoked') {
    return { action: 'reject', code: 'revoked', message: 'This invite is no longer available.' };
  }
  if (Date.parse(row.expires_at) <= now.getTime()) {
    return { action: 'reject', code: 'expired', message: 'This invite has expired.' };
  }
  if (normalizeInviteEmail(params.email) !== row.email_lock) {
    return {
      action: 'reject',
      code: 'email_mismatch',
      message: 'This invite is for a different email.',
    };
  }
  if (row.status === 'redeemed') {
    return { action: 'reject', code: 'used', message: 'This invite has already been used.' };
  }
  if (row.status === 'claimed') {
    if (row.claimed_by_user_id === params.userId) {
      return { action: 'idempotent' };
    }
    return { action: 'reject', code: 'used', message: 'This invite has already been used.' };
  }
  if (row.status !== 'available') {
    return { action: 'reject', code: 'invalid', message: 'This link is not valid.' };
  }
  return { action: 'claim' };
}

function toClaimed(row: InviteRow): ClaimedGuestInvite {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    durationMinutes: row.duration_minutes,
    campaignId: row.campaign_id,
    marketingReferrer: row.marketing_referrer,
    expiresAt: row.expires_at,
    emailLock: row.email_lock,
  };
}

async function loadByHash(token: string): Promise<InviteRow | null> {
  const tokenHash = hashGuestInviteToken(token);
  const { data, error } = await supabaseAdmin
    .from('guest_session_invites')
    .select(
      'id, token_hash, email_lock, mentor_id, duration_minutes, campaign_id, marketing_referrer, status, expires_at, claimed_by_user_id, redeemed_booking_id',
    )
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) {
    throw new Error(`guest invite lookup failed: ${error.message}`);
  }
  return (data as InviteRow | null) ?? null;
}

export async function lookupGuestInvite(token: string, now: Date = new Date()) {
  const row = await loadByHash(token);
  if (!row) return { kind: 'invalid' as const };
  if (row.status === 'revoked') return { kind: 'revoked' as const };
  if (Date.parse(row.expires_at) <= now.getTime()) return { kind: 'expired' as const };
  if (row.status === 'redeemed' || row.status === 'claimed') {
    return { kind: 'used' as const, expiresAt: row.expires_at };
  }
  return { kind: 'offer' as const, expiresAt: row.expires_at };
}

export async function claimGuestInvite(params: {
  token: string;
  userId: string;
  email: string;
  now?: Date;
}): Promise<ClaimedGuestInvite> {
  const now = params.now ?? new Date();
  const row = await loadByHash(params.token);
  const decision = claimDecision({
    row,
    email: params.email,
    userId: params.userId,
    now,
  });
  if (decision.action === 'reject') {
    throw new GuestInviteClaimError(decision.code, decision.message);
  }
  if (decision.action === 'idempotent' && row) {
    return toClaimed(row);
  }
  if (!row) {
    throw new GuestInviteClaimError('invalid', 'This link is not valid.');
  }

  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from('guest_session_invites')
    .update({
      status: 'claimed',
      claimed_by_user_id: params.userId,
      claimed_at: nowIso,
    })
    .eq('id', row.id)
    .eq('status', 'available')
    .eq('email_lock', normalizeInviteEmail(params.email))
    .gt('expires_at', nowIso)
    .select(
      'id, token_hash, email_lock, mentor_id, duration_minutes, campaign_id, marketing_referrer, status, expires_at, claimed_by_user_id, redeemed_booking_id',
    );

  if (error) {
    throw new Error(`guest invite claim failed: ${error.message}`);
  }
  const updated = Array.isArray(data) ? (data[0] as InviteRow | undefined) : undefined;
  if (!updated) {
    const again = await loadByHash(params.token);
    const retry = claimDecision({
      row: again,
      email: params.email,
      userId: params.userId,
      now,
    });
    if (retry.action === 'idempotent' && again) return toClaimed(again);
    if (retry.action === 'reject') {
      throw new GuestInviteClaimError(retry.code, retry.message);
    }
    throw new GuestInviteClaimError('used', 'This invite has already been used.');
  }
  return toClaimed(updated);
}

export async function getClaimedInviteForUser(
  userId: string,
  now: Date = new Date(),
): Promise<ClaimedGuestInvite | null> {
  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from('guest_session_invites')
    .select(
      'id, token_hash, email_lock, mentor_id, duration_minutes, campaign_id, marketing_referrer, status, expires_at, claimed_by_user_id, redeemed_booking_id',
    )
    .eq('claimed_by_user_id', userId)
    .eq('status', 'claimed')
    .gt('expires_at', nowIso)
    .order('claimed_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`guest invite lookup failed: ${error.message}`);
  }
  const row = (data?.[0] as InviteRow | undefined) ?? null;
  return row ? toClaimed(row) : null;
}

export async function getInviteForBooking(params: {
  inviteId: string;
  userId: string;
  email: string;
  now?: Date;
}): Promise<ClaimedGuestInvite> {
  const now = params.now ?? new Date();
  const { data, error } = await supabaseAdmin
    .from('guest_session_invites')
    .select(
      'id, token_hash, email_lock, mentor_id, duration_minutes, campaign_id, marketing_referrer, status, expires_at, claimed_by_user_id, redeemed_booking_id',
    )
    .eq('id', params.inviteId)
    .maybeSingle();

  if (error) {
    throw new Error(`guest invite lookup failed: ${error.message}`);
  }
  const row = data as InviteRow | null;
  if (!row || row.status !== 'claimed' || row.claimed_by_user_id !== params.userId) {
    throw new Error('This complimentary session is no longer available.');
  }
  if (Date.parse(row.expires_at) <= now.getTime()) {
    throw new Error('This complimentary session has expired.');
  }
  if (normalizeInviteEmail(params.email) !== row.email_lock) {
    throw new Error('This invite is for a different email.');
  }
  if (row.duration_minutes !== GUEST_INVITE_DURATION_MINUTES) {
    throw new Error('This complimentary session is no longer available.');
  }
  return toClaimed(row);
}

export async function redeemGuestInviteForBooking(params: {
  inviteId: string;
  userId: string;
  bookingId: string;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from('guest_session_invites')
    .update({
      status: 'redeemed',
      redeemed_at: nowIso,
      redeemed_booking_id: params.bookingId,
    })
    .eq('id', params.inviteId)
    .eq('claimed_by_user_id', params.userId)
    .eq('status', 'claimed')
    .gt('expires_at', nowIso)
    .select('id');

  if (error) {
    throw new Error(`guest invite redeem failed: ${error.message}`);
  }
  return Array.isArray(data) && data.length === 1;
}

/** Cancel-before-start: give the same person another chance to pick a time. */
export async function restoreGuestInviteAfterCancel(params: {
  bookingId: string;
  scheduledAt: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  if (Date.parse(params.scheduledAt) <= now.getTime()) return;
  const nowIso = now.toISOString();
  await supabaseAdmin
    .from('guest_session_invites')
    .update({
      status: 'claimed',
      redeemed_at: null,
      redeemed_booking_id: null,
    })
    .eq('redeemed_booking_id', params.bookingId)
    .eq('status', 'redeemed')
    .gt('expires_at', nowIso);
}

type OccupiedBooking = {
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
};

export async function assertChrisWindowFree(params: {
  mentorId: string;
  scheduledAt: string;
  durationMinutes: number;
}): Promise<void> {
  const startMs = Date.parse(params.scheduledAt);
  if (!Number.isFinite(startMs)) {
    throw new Error('Choose a session time.');
  }
  const windowStart = new Date(startMs - 120 * 60_000).toISOString();
  const windowEnd = new Date(startMs + params.durationMinutes * 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('scheduled_at, duration_minutes, status')
    .eq('mentor_id', params.mentorId)
    .in('status', [...OCCUPIED_BOOKING_STATUSES])
    .gte('scheduled_at', windowStart)
    .lt('scheduled_at', windowEnd);

  if (error) {
    throw new Error(`Could not check Chris's calendar: ${error.message}`);
  }

  const clash = ((data ?? []) as OccupiedBooking[]).some((row) =>
    sessionWindowsOverlap(
      params.scheduledAt,
      params.durationMinutes,
      row.scheduled_at,
      row.duration_minutes && row.duration_minutes > 0 ? row.duration_minutes : 45,
    ),
  );
  if (clash) {
    throw new Error('Chris already has a session then. Pick another time.');
  }
}
