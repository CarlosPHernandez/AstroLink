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

export async function resolveAppSessionFromAuthUser(user: User): Promise<SessionData | null> {
  const email = user.email?.trim().toLowerCase() ?? '';
  const fullName = fullNameFromUser(user);

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

      const { data: appState } = await supabaseAdmin
        .from('user_app_state')
        .select('onboarded')
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        userId: mentorByEmail.id,
        email: mentorByEmail.email,
        role: 'mentor',
        fullName: mentorByEmail.full_name,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        onboarded: appState?.onboarded ?? true,
      };
    }
  }

  const { data: appState } = await supabaseAdmin
    .from('user_app_state')
    .select('role, onboarded')
    .eq('user_id', user.id)
    .maybeSingle();

  if (appState?.role === 'admin' && email && isAdminEmailAllowed(email)) {
    const menteeId = await ensureMenteeUserRow({ userId: user.id, email, fullName });
    return {
      userId: menteeId,
      email,
      role: 'admin',
      fullName,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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