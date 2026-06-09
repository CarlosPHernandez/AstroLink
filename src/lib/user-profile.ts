import 'server-only';

import { randomUUID } from 'crypto';
import {
  isSupportedTargetLocale,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';
import { supabaseAdmin } from '@/lib/supabase';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveUserId(candidate: string): string {
  return UUID_RE.test(candidate) ? candidate : randomUUID();
}

export interface MenteeProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  bio: string;
  preferredLocale: SupportedTargetLocale;
  stripeCustomerId: string | null;
}

export interface MenteeProfileUpdate {
  fullName: string;
  email: string;
  phone: string | null;
  bio: string;
  preferredLocale: SupportedTargetLocale;
}

/**
 * Ensures a `users` row exists for mentee auth and returns the canonical user id.
 * On email conflict, updates name and returns the existing row id.
 */
export async function ensureMenteeUserRow(params: {
  userId: string;
  email: string;
  fullName: string;
}): Promise<string> {
  const email = params.email.trim().toLowerCase();

  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupErr) {
    console.error('ensureMenteeUserRow lookup:', lookupErr.message);
    throw new Error('Could not verify user profile.');
  }

  if (existing) {
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        full_name: params.fullName,
      })
      .eq('id', existing.id);

    if (updateErr) {
      console.error('ensureMenteeUserRow update:', updateErr.message);
      throw new Error('Could not update user profile.');
    }

    return existing.id;
  }

  const insertId = resolveUserId(params.userId);

  const { error: insertErr } = await supabaseAdmin.from('users').insert({
    id: insertId,
    email,
    full_name: params.fullName,
  });

  if (insertErr) {
    console.error('ensureMenteeUserRow insert:', insertErr.message);
    throw new Error('Could not create user profile.');
  }

  return insertId;
}

export async function getMenteeProfile(userId: string): Promise<MenteeProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, phone, bio, preferred_locale, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('getMenteeProfile:', error.message);
    }
    return null;
  }

  const preferredLocale = isSupportedTargetLocale(data.preferred_locale)
    ? data.preferred_locale
    : 'en';

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    phone: data.phone,
    bio: data.bio ?? '',
    preferredLocale,
    stripeCustomerId: data.stripe_customer_id,
  };
}

export async function updateMenteeProfile(
  userId: string,
  update: MenteeProfileUpdate,
): Promise<MenteeProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      full_name: update.fullName,
      email: update.email.trim().toLowerCase(),
      phone: update.phone,
      bio: update.bio,
      preferred_locale: update.preferredLocale,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, email, full_name, phone, bio, preferred_locale, stripe_customer_id')
    .single();

  if (error || !data) {
    console.error('updateMenteeProfile:', error?.message);
    return null;
  }

  const preferredLocale = isSupportedTargetLocale(data.preferred_locale)
    ? data.preferred_locale
    : 'en';

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    phone: data.phone,
    bio: data.bio ?? '',
    preferredLocale,
    stripeCustomerId: data.stripe_customer_id,
  };
}

export async function setMenteeStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('setMenteeStripeCustomerId:', error.message);
    throw new Error('Could not save Stripe customer id.');
  }
}
