import 'server-only';

import type { User } from '@supabase/supabase-js';
import { isAdminEmailAllowed } from '@/lib/app-mode';
import { ensureMenteeUserRow } from '@/lib/user-profile';
import { supabaseAdmin } from '@/lib/supabase';
import type { SessionData } from '@/lib/session';

function fullNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    '';
  if (fromMeta.trim()) {
    return fromMeta.trim();
  }
  if (user.email) {
    const prefix = user.email.split('@')[0] ?? 'User';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'AstroLink User';
}

/**
 * Map Supabase Auth user id → public.users.id.
 * Auth trigger may create public.users with a different primary key and auth_id link.
 * user_app_state.user_id FKs public.users.id (not always auth.users.id).
 */
export async function resolvePublicUserIdForAuthUser(params: {
  authUserId: string;
  email: string;
}): Promise<string | null> {
  const email = params.email.trim().toLowerCase();

  if (email) {
    const { data: byEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (byEmail?.id) {
      return byEmail.id;
    }
  }

  const { data: byAuthId } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', params.authUserId)
    .maybeSingle();
  if (byAuthId?.id) {
    return byAuthId.id;
  }

  const { data: byPk } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', params.authUserId)
    .maybeSingle();

  return byPk?.id ?? null;
}

async function loadAppState(userIds: string[]): Promise<{
  role: string | null;
  onboarded: boolean | null;
} | null> {
  const unique = [...new Set(userIds.filter(Boolean))];
  for (const userId of unique) {
    const { data } = await supabaseAdmin
      .from('user_app_state')
      .select('role, onboarded')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      return data;
    }
  }
  return null;
}

export async function resolveAppSessionFromAuthUser(user: User): Promise<SessionData | null> {
  const email = user.email?.trim().toLowerCase() ?? '';
  const fullName = fullNameFromUser(user);
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Env allowlist is the strongest admin grant (ops emails on Vercel).
  if (email && isAdminEmailAllowed(email)) {
    const adminCheck = process.env.ADMIN_EMAILS?.trim();
    if (adminCheck) {
      const menteeId = await ensureMenteeUserRow({
        userId: user.id,
        email,
        fullName,
      });
      return {
        userId: menteeId,
        email,
        role: 'admin',
        fullName,
        expiresAt: sessionExpiry,
        onboarded: true,
      };
    }
  }

  const { data: mentorByUser } = await supabaseAdmin
    .from('mentors')
    .select('id, full_name, email, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (mentorByUser) {
    return {
      userId: mentorByUser.id,
      email: mentorByUser.email,
      role: 'mentor',
      fullName: mentorByUser.full_name,
      expiresAt: sessionExpiry,
      onboarded: true,
    };
  }

  if (email) {
    const { data: mentorByEmail } = await supabaseAdmin
      .from('mentors')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();

    if (mentorByEmail) {
      await supabaseAdmin
        .from('mentors')
        .update({ user_id: user.id })
        .eq('id', mentorByEmail.id);

      const publicUserId = await resolvePublicUserIdForAuthUser({
        authUserId: user.id,
        email,
      });
      const appState = await loadAppState(
        [publicUserId ?? '', user.id].filter(Boolean),
      );

      return {
        userId: mentorByEmail.id,
        email: mentorByEmail.email,
        role: 'mentor',
        fullName: mentorByEmail.full_name,
        expiresAt: sessionExpiry,
        onboarded: appState?.onboarded ?? true,
      };
    }
  }

  // user_app_state is keyed by public.users.id — resolve that before auth UUID.
  const publicUserId = await resolvePublicUserIdForAuthUser({
    authUserId: user.id,
    email,
  });
  const appState = await loadAppState([publicUserId ?? '', user.id].filter(Boolean));

  if (appState?.role === 'admin' && email && isAdminEmailAllowed(email)) {
    const menteeId = await ensureMenteeUserRow({ userId: user.id, email, fullName });
    return {
      userId: menteeId,
      email,
      role: 'admin',
      fullName,
      expiresAt: sessionExpiry,
      onboarded: true,
    };
  }

  const menteeId = await ensureMenteeUserRow({
    userId: user.id,
    email: email || `user-${user.id}@placeholder.local`,
    fullName,
  });

  return {
    userId: menteeId,
    email: email || '',
    role: 'mentee',
    fullName,
    expiresAt: sessionExpiry,
    onboarded: true,
  };
}

export function needsProfileCompletion(user: User): boolean {
  const email = user.email?.trim();
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    '';
  return !email || !fullName;
}
