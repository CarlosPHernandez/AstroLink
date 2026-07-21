import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import {
  defaultClaimExpiry,
  generateClaimTokenRaw,
  hashClaimToken,
} from '@/lib/mentor-activation/token';
import type { CreateInviteResult } from '@/lib/mentor-activation/types';
import { supabaseAdmin } from '@/lib/supabase';

export class MentorInviteError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'conflict' | 'invalid' | 'db' = 'invalid',
  ) {
    super(message);
    this.name = 'MentorInviteError';
  }
}

/**
 * Creates a claim token and sets pending_email. Does not send email.
 * Caller is responsible for Resend delivery using rawToken.
 */
export async function createMentorInvite(params: {
  mentorId: string;
  email: string;
  expiresInHours?: number;
  createdBy?: string | null;
}): Promise<CreateInviteResult> {
  const email = params.email.trim().toLowerCase();
  const mentorId = params.mentorId;

  const { data: mentor, error: mentorErr } = await supabaseAdmin
    .from('mentors')
    .select('id, email, pending_email, activation_status')
    .eq('id', mentorId)
    .maybeSingle();

  if (mentorErr) {
    throw new MentorInviteError(mentorErr.message, 'db');
  }
  if (!mentor) {
    throw new MentorInviteError('Expert not found.', 'not_found');
  }

  const { data: emailOwner } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('email', email)
    .neq('id', mentorId)
    .maybeSingle();
  const { data: pendingOwner } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('pending_email', email)
    .neq('id', mentorId)
    .maybeSingle();

  if (emailOwner?.id || pendingOwner?.id) {
    throw new MentorInviteError(
      'That email is already used by another expert profile.',
      'conflict',
    );
  }

  // Revoke prior unused tokens for this mentor (not "used" — never claimed).
  await supabaseAdmin
    .from('mentor_claim_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('mentor_id', mentorId)
    .is('used_at', null)
    .is('revoked_at', null);

  const rawToken = generateClaimTokenRaw();
  const tokenHash = hashClaimToken(rawToken);
  const expiresAt = defaultClaimExpiry(params.expiresInHours ?? 72);

  const { error: tokenErr } = await supabaseAdmin.from('mentor_claim_tokens').insert({
    mentor_id: mentorId,
    token_hash: tokenHash,
    email,
    expires_at: expiresAt.toISOString(),
    created_by: params.createdBy ?? null,
  });

  if (tokenErr) {
    throw new MentorInviteError(tokenErr.message, 'db');
  }

  const { error: updateErr } = await supabaseAdmin
    .from('mentors')
    .update({
      pending_email: email,
      activation_status: 'pending',
    })
    .eq('id', mentorId);

  if (updateErr) {
    throw new MentorInviteError(updateErr.message, 'db');
  }

  return {
    mentorId,
    email,
    expiresAt: expiresAt.toISOString(),
    rawToken,
  };
}

export function buildActivateUrl(rawToken: string): string {
  const base = getAppBaseUrl();
  return `${base}/activate?token=${encodeURIComponent(rawToken)}`;
}

export async function revokeMentorInvites(mentorId: string): Promise<void> {
  await supabaseAdmin
    .from('mentor_claim_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('mentor_id', mentorId)
    .is('used_at', null)
    .is('revoked_at', null);

  await supabaseAdmin
    .from('mentors')
    .update({ pending_email: null })
    .eq('id', mentorId)
    .eq('activation_status', 'pending');
}
