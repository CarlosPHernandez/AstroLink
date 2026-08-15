import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

export const SESSION_COMP_CREDIT_MINUTES = 15;

export type SessionCompGrantStatus = 'available' | 'redeemed' | 'revoked';

export type SessionCompGrantView = {
  id: string;
  creditMinutes: number;
  status: SessionCompGrantStatus;
  expiresAt: string | null;
  eligibleScope: string;
};

type GrantRow = {
  id: string;
  user_id: string;
  credit_minutes: number;
  status: string;
  expires_at: string | null;
  eligible_scope: string;
};

function isExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

function toView(row: GrantRow): SessionCompGrantView {
  return {
    id: row.id,
    creditMinutes: row.credit_minutes,
    status: row.status as SessionCompGrantStatus,
    expiresAt: row.expires_at,
    eligibleScope: row.eligible_scope,
  };
}

/** Available, non-expired grant for mentee (public.users.id). */
export async function getAvailableGrantForUser(
  userId: string,
  now: Date = new Date(),
): Promise<SessionCompGrantView | null> {
  const { data, error } = await supabaseAdmin
    .from('session_comp_grants')
    .select('id, user_id, credit_minutes, status, expires_at, eligible_scope')
    .eq('user_id', userId)
    .eq('status', 'available')
    .maybeSingle();

  if (error) {
    throw new Error(`session_comp_grants lookup failed: ${error.message}`);
  }
  if (!data) return null;

  const row = data as GrantRow;
  if (isExpired(row.expires_at, now)) {
    return null;
  }
  return toView(row);
}

/**
 * Validate grant can be applied to this booking attempt.
 * Does not redeem.
 */
export function assertGrantApplicable(params: {
  grant: SessionCompGrantView;
  menteeId: string;
  durationMinutes: number | undefined;
  now?: Date;
}): void {
  const now = params.now ?? new Date();
  if (params.grant.status !== 'available') {
    throw new Error('This complimentary session is no longer available.');
  }
  if (isExpired(params.grant.expiresAt, now)) {
    throw new Error('This complimentary session has expired.');
  }
  const minutes = params.durationMinutes ?? 0;
  if (minutes !== SESSION_COMP_CREDIT_MINUTES) {
    throw new Error(
      'Complimentary session only applies to 15-minute bookings. Longer sessions are full price.',
    );
  }
}

/**
 * Atomic redeem: only succeeds if still available and unexpired.
 * Returns true when exactly one row was updated.
 */
export async function redeemGrantForBooking(params: {
  grantId: string;
  userId: string;
  bookingId: string;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();

  // Expiry was checked at apply; atomic status guard prevents double redeem.
  const { data, error } = await supabaseAdmin
    .from('session_comp_grants')
    .update({
      status: 'redeemed',
      redeemed_at: nowIso,
      redeemed_booking_id: params.bookingId,
    })
    .eq('id', params.grantId)
    .eq('user_id', params.userId)
    .eq('status', 'available')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .select('id');

  if (error) {
    throw new Error(`session_comp_grants redeem failed: ${error.message}`);
  }

  return Array.isArray(data) && data.length === 1;
}

/** Load grant by id and user for apply path (must still be available). */
export async function getGrantForApply(params: {
  grantId: string;
  userId: string;
  now?: Date;
}): Promise<SessionCompGrantView> {
  const now = params.now ?? new Date();
  const { data, error } = await supabaseAdmin
    .from('session_comp_grants')
    .select('id, user_id, credit_minutes, status, expires_at, eligible_scope')
    .eq('id', params.grantId)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`session_comp_grants lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new Error('Complimentary session not found for this account.');
  }

  const row = data as GrantRow;
  if (row.status !== 'available' || isExpired(row.expires_at, now)) {
    throw new Error('This complimentary session is no longer available.');
  }

  return toView(row);
}

export function formatGrantExpiryLabel(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(expiresAt));
}
