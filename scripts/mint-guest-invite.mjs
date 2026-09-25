/**
 * Mint or revoke a single email-locked guest invite for a 25-minute Chris session.
 *
 *   node --env-file=.env.local scripts/mint-guest-invite.mjs --email him@example.com --note "lockheed thread"
 *   node --env-file=.env.local scripts/mint-guest-invite.mjs --revoke <invite-uuid>
 *
 * Prints the URL once. The database stores only a hash of the token.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

function arg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return process.argv[index + 1] ?? '';
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const revokeId = arg('--revoke');
if (revokeId) {
  const { data, error } = await supabase
    .from('guest_session_invites')
    .update({ status: 'revoked' })
    .eq('id', revokeId)
    .in('status', ['available', 'claimed'])
    .select('id');
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.error('No available or claimed invite with that id.');
    process.exit(1);
  }
  console.log(`Revoked ${revokeId}`);
  process.exit(0);
}

const email = arg('--email').trim().toLowerCase();
const note = arg('--note').trim();
const days = Number.parseInt(arg('--days') || '14', 10);
if (!email.includes('@') || email !== email.toLowerCase()) {
  console.error('Pass --email the address he will sign up with.');
  process.exit(1);
}
if (!Number.isFinite(days) || days < 1) {
  console.error('--days must be a positive number.');
  process.exit(1);
}

const slug = process.env.CHRIS_MENTOR_SLUG?.trim() || 'chris-sembroski';
const { data: mentor, error: mentorError } = await supabase
  .from('mentors')
  .select('id')
  .eq('slug', slug)
  .maybeSingle();
if (mentorError || !mentor?.id) {
  console.error(mentorError?.message ?? `No mentor with slug ${slug}`);
  process.exit(1);
}

const token = crypto.randomBytes(32).toString('base64url');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const { data: created, error } = await supabase
  .from('guest_session_invites')
  .insert({
    token_hash: tokenHash,
    email_lock: email,
    mentor_id: mentor.id,
    expires_at: expiresAt,
    internal_note: note || null,
    created_by: 'ops_script',
  })
  .select('id')
  .single();

if (error || !created?.id) {
  console.error(error?.message ?? 'Insert failed');
  process.exit(1);
}

const base = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://astro-link.space').replace(
  /\/$/,
  '',
);
console.log(`id: ${created.id}`);
console.log(`expires: ${expiresAt}`);
console.log(`${base}/invite/${token}`);
