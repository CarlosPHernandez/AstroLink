import 'server-only';

import { hashClaimToken, isClaimExpired } from '@/lib/mentor-activation/token';
import type { MentorClaimTokenRow } from '@/lib/mentor-activation/types';
import type { Database } from '@/lib/database.types';
import { resolvePublicUserIdForAuthUser } from '@/lib/resolve-app-session';
import { supabaseAdmin } from '@/lib/supabase';
import { ensureMenteeUserRow } from '@/lib/user-profile';

type MentorActivationRow = Pick<
  Database['public']['Tables']['mentors']['Row'],
  | 'id'
  | 'full_name'
  | 'email'
  | 'title'
  | 'employer'
  | 'expertise'
  | 'bio'
  | 'live_session_price_cents'
  | 'activation_status'
  | 'payout_method'
  | 'payout_handle'
>;

export class MentorClaimError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid'
      | 'expired'
      | 'used'
      | 'revoked'
      | 'email_mismatch'
      | 'conflict'
      | 'db' = 'invalid',
  ) {
    super(message);
    this.name = 'MentorClaimError';
  }
}

function mapTokenRow(data: {
  id: string;
  mentor_id: string;
  token_hash: string;
  email: string;
  expires_at: string;
  used_at: string | null;
  revoked_at?: string | null;
  created_by: string | null;
  created_at: string;
}): MentorClaimTokenRow & { mentor_id: string; revoked_at: string | null } {
  return {
    id: data.id,
    mentor_id: data.mentor_id,
    token_hash: data.token_hash,
    email: data.email,
    expires_at: data.expires_at,
    used_at: data.used_at,
    created_by: data.created_by,
    created_at: data.created_at,
    revoked_at: data.revoked_at ?? null,
  };
}

export async function loadValidClaimToken(
  rawToken: string,
): Promise<MentorClaimTokenRow & { mentor_id: string }> {
  const tokenHash = hashClaimToken(rawToken);
  const { data, error } = await supabaseAdmin
    .from('mentor_claim_tokens')
    .select(
      'id, mentor_id, token_hash, email, expires_at, used_at, revoked_at, created_by, created_at',
    )
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    throw new MentorClaimError(error.message, 'db');
  }
  if (!data) {
    throw new MentorClaimError('This activation link is invalid.', 'invalid');
  }
  if (data.revoked_at) {
    throw new MentorClaimError('This activation link was revoked. Request a new invite.', 'revoked');
  }
  if (data.used_at) {
    throw new MentorClaimError('This activation link was already used.', 'used');
  }
  if (isClaimExpired(data.expires_at)) {
    throw new MentorClaimError('This activation link has expired.', 'expired');
  }

  return mapTokenRow(data);
}

/**
 * Atomically consume claim token, then attach mentor row to the signed-in auth user.
 * Token is burned before mentor update so concurrent claims cannot double-apply.
 * If mentor update fails after consume, ops re-invites (token not reusable).
 */
export async function linkMentorClaim(params: {
  rawToken: string;
  authUserId: string;
  authEmail: string;
  fullName?: string;
}): Promise<{ mentorId: string }> {
  const tokenHash = hashClaimToken(params.rawToken);
  const authEmail = params.authEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();

  // 1) Consume token (CAS). Only one concurrent caller wins.
  const { data: consumed, error: consumeErr } = await supabaseAdmin
    .from('mentor_claim_tokens')
    .update({ used_at: nowIso })
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .select('id, mentor_id, email, expires_at, used_at, revoked_at, token_hash, created_by, created_at')
    .maybeSingle();

  if (consumeErr) {
    throw new MentorClaimError(consumeErr.message, 'db');
  }
  if (!consumed) {
    // Distinguish why: re-read for message
    await loadValidClaimToken(params.rawToken).catch((err: unknown) => {
      if (err instanceof MentorClaimError) {
        throw err;
      }
      throw new MentorClaimError('This activation link is invalid.', 'invalid');
    });
    throw new MentorClaimError('This activation link was already used.', 'used');
  }

  if (authEmail !== consumed.email.trim().toLowerCase()) {
    throw new MentorClaimError(
      'Signed-in email does not match this activation invite.',
      'email_mismatch',
    );
  }

  const { data: mentor, error: mentorErr } = await supabaseAdmin
    .from('mentors')
    .select('id, email, full_name, user_id')
    .eq('id', consumed.mentor_id)
    .maybeSingle();

  if (mentorErr || !mentor) {
    throw new MentorClaimError(mentorErr?.message ?? 'Expert not found.', 'db');
  }

  let publicUserId = await resolvePublicUserIdForAuthUser({
    authUserId: params.authUserId,
    email: authEmail,
  });

  if (!publicUserId) {
    publicUserId = await ensureMenteeUserRow({
      userId: params.authUserId,
      email: authEmail,
      fullName: params.fullName?.trim() || mentor.full_name,
    });
  } else {
    await supabaseAdmin
      .from('users')
      .update({ auth_id: params.authUserId })
      .eq('id', publicUserId)
      .is('auth_id', null);
  }

  const { data: emailOwner } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('email', authEmail)
    .neq('id', mentor.id)
    .maybeSingle();

  if (emailOwner?.id) {
    throw new MentorClaimError(
      'That email is already linked to another expert.',
      'conflict',
    );
  }

  const { error: updateErr } = await supabaseAdmin
    .from('mentors')
    .update({
      user_id: publicUserId,
      email: authEmail,
      pending_email: null,
      activation_status: 'pending',
    })
    .eq('id', mentor.id);

  if (updateErr) {
    throw new MentorClaimError(
      `${updateErr.message} (invite was consumed — request a new invite)`,
      'db',
    );
  }

  return { mentorId: mentor.id };
}

export async function completeMentorActivation(mentorId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('mentors')
    .update({
      activation_status: 'active',
      activated_at: new Date().toISOString(),
    })
    .eq('id', mentorId);

  if (error) {
    throw new MentorClaimError(error.message, 'db');
  }
}

export async function getMentorActivationRow(
  mentorId: string,
): Promise<MentorActivationRow | null> {
  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select(
      'id, full_name, email, title, employer, expertise, bio, live_session_price_cents, activation_status, payout_method, payout_handle',
    )
    .eq('id', mentorId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data;
}
