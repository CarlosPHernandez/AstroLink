'use server';

import { redirect } from 'next/navigation';

import {
  completeMentorActivation,
  getMentorActivationRow,
  linkMentorClaim,
  loadValidClaimToken,
  MentorClaimError,
} from '@/lib/mentor-activation/claim';
import {
  ActivationProfileSchema,
  parseExpertiseList,
  PayoutPreferenceSchema,
} from '@/lib/mentor-activation/schemas';
import { requireMentorSession } from '@/lib/mentor-activation/require-activated-mentor';
import { createSession, isUsingDemoSessionCookie } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateMentorDirectory } from '@/lib/revalidate-mentors';

export type ActivateActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

/**
 * Validates claim token, establishes a Supabase session server-side (no email bounce),
 * then continues to /activate/complete to attach the mentor row.
 *
 * We intentionally avoid redirecting to generateLink action_link: those OTP links are
 * one-shot email tokens and often fail when opened as an immediate browser redirect
 * (Site URL / PKCE / "expired or invalid" on Supabase verify).
 */
export async function beginClaimAction(
  _prev: ActivateActionState | undefined,
  formData: FormData,
): Promise<ActivateActionState> {
  const rawToken = formData.get('token')?.toString() ?? '';
  if (!rawToken) {
    return { success: false, message: 'Missing activation token.' };
  }

  try {
    const token = await loadValidClaimToken(rawToken);
    const email = token.email.trim().toLowerCase();

    // Ensure Auth user exists (invite path may have created them already).
    const { error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: email.split('@')[0] ?? 'Expert' },
    });
    if (
      createAuthErr &&
      !/already|registered|exists/i.test(createAuthErr.message ?? '')
    ) {
      console.error('beginClaimAction createUser:', createAuthErr.message);
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      console.error('beginClaimAction generateLink:', error?.message);
      return {
        success: false,
        message: 'Could not start secure sign-in. Request a new invite from support.',
      };
    }

    // Set session cookies on this response via the SSR client (not external action_link).
    const supabase = await createClient();
    let verifyError = (
      await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: tokenHash,
      })
    ).error;

    if (verifyError) {
      // Older/newer Supabase builds accept the hash under type "email".
      verifyError = (
        await supabase.auth.verifyOtp({
          type: 'email',
          token_hash: tokenHash,
        })
      ).error;
    }

    if (verifyError) {
      console.error('beginClaimAction verifyOtp:', verifyError.message, verifyError.code);
      return {
        success: false,
        message:
          'Could not complete secure sign-in. Request a new invite and try again, or contact support.',
      };
    }

    redirect(`/activate/complete?token=${encodeURIComponent(rawToken)}`);
  } catch (err: unknown) {
    if (err instanceof MentorClaimError) {
      return { success: false, message: err.message };
    }
    throw err;
  }
}

export async function completeClaimLinkAction(rawToken: string): Promise<ActivateActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      success: false,
      message: 'Sign-in session missing. Open the invite email again.',
    };
  }

  try {
    await linkMentorClaim({
      rawToken,
      authUserId: user.id,
      authEmail: user.email,
      fullName:
        (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
        undefined,
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof MentorClaimError) {
      return { success: false, message: err.message };
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Could not link your expert profile.',
    };
  }
}

export async function saveActivationProfileAction(
  _prev: ActivateActionState | undefined,
  formData: FormData,
): Promise<ActivateActionState> {
  const gate = await requireMentorSession();
  if (!gate.ok) {
    return { success: false, message: gate.message };
  }
  const session = gate.session;

  const parsed = ActivationProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    title: formData.get('title'),
    employer: formData.get('employer'),
    expertise: formData.get('expertise'),
    bio: formData.get('bio'),
    rate: formData.get('rate'),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const expertise = parseExpertiseList(parsed.data.expertise);
  if (expertise.length === 0) {
    return {
      success: false,
      errors: { expertise: ['List at least one area of expertise.'] },
    };
  }

  const { error } = await supabaseAdmin
    .from('mentors')
    .update({
      full_name: parsed.data.fullName,
      title: parsed.data.title || null,
      employer: parsed.data.employer,
      expertise,
      bio: parsed.data.bio,
      live_session_price_cents: parsed.data.rate * 100,
    })
    .eq('id', session.userId);

  if (error) {
    return { success: false, message: 'Could not save profile. Try again.' };
  }

  revalidateMentorDirectory();
  return { success: true, message: 'Profile saved.' };
}

export async function savePayoutPreferenceAction(
  _prev: ActivateActionState | undefined,
  formData: FormData,
): Promise<ActivateActionState> {
  const gate = await requireMentorSession();
  if (!gate.ok) {
    return { success: false, message: gate.message };
  }
  const session = gate.session;

  const parsed = PayoutPreferenceSchema.safeParse({
    payoutMethod: formData.get('payoutMethod') ?? 'unset',
    payoutHandle: formData.get('payoutHandle') ?? '',
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const method = parsed.data.payoutMethod;
  const handle =
    method === 'unset' || method === 'bank_manual'
      ? null
      : parsed.data.payoutHandle.trim() || null;

  const { error } = await supabaseAdmin
    .from('mentors')
    .update({
      payout_method: method,
      payout_handle: handle,
    })
    .eq('id', session.userId);

  if (error) {
    return { success: false, message: 'Could not save payout preference.' };
  }

  return { success: true, message: 'Payout preference saved.' };
}

export async function completeActivationAction(): Promise<ActivateActionState> {
  const gate = await requireMentorSession();
  if (!gate.ok) {
    return { success: false, message: gate.message };
  }
  const session = gate.session;

  const row = await getMentorActivationRow(session.userId);
  if (!row) {
    return { success: false, message: 'Expert profile not found.' };
  }

  if (row.bio.trim().length < 10 || !row.employer.trim() || row.expertise.length === 0) {
    return {
      success: false,
      message: 'Finish your profile details before completing setup.',
    };
  }

  try {
    await completeMentorActivation(session.userId);
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Could not complete activation.',
    };
  }

  // Demo cookie auth does not re-resolve from DB — refresh session to clear pending gate.
  if (isUsingDemoSessionCookie()) {
    await createSession({
      userId: session.userId,
      email: session.email,
      role: 'mentor',
      fullName: session.fullName,
      onboarded: true,
      activationStatus: 'active',
    });
  }

  redirect('/dashboard/mentor');
}
