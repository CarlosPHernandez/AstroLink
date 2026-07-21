'use server';

import { randomUUID } from 'crypto';
import {
  getDefaultPathAfterAuth,
  getSafeRedirectPath,
  isActivationClaimNextPath,
} from '@/lib/auth-redirect';
import { appAuthPath } from '@/lib/app-url';
import {
  isAdminEmailAllowed,
  isDemoAuthEnabled,
  isSupabaseAuthEnabled,
} from '@/lib/app-mode';
import { resolvePresetLogin } from '@/lib/auth-presets';
import {
  needsProfileCompletion,
  resolveAppSessionFromAuthUser,
} from '@/lib/resolve-app-session';
import { createSession, deleteSession, getSession } from '@/lib/session';
import {
  mapSupabaseSignInError,
  mapSupabaseSignUpError,
} from '@/lib/supabase/auth-error-message';
import { createClient } from '@/lib/supabase/server';
import { ensureMenteeUserRow } from '@/lib/user-profile';
import { WAITLIST_PUBLIC_LANDING_PATH } from '@/lib/waitlist/waitlist-landing';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Use at least 8 characters.' }),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, { message: 'Enter your full name.' }),
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Use at least 8 characters.' }),
});

const PhoneSchema = z.object({
  phone: z
    .string()
    .min(10, { message: 'Enter a valid phone number.' })
    .regex(/^\+[1-9]\d{7,14}$/, { message: 'Use international format, e.g. +15551234567.' }),
});

const OtpSchema = z.object({
  phone: z.string().min(10),
  token: z
    .string()
    .length(6, { message: 'Enter the 6-digit code.' })
    .regex(/^\d{6}$/, { message: 'Enter the 6-digit code.' }),
});

const CompleteProfileSchema = z.object({
  fullName: z.string().min(2, { message: 'Enter your full name.' }),
  email: z.string().email({ message: 'Enter a valid email address.' }),
});

const OnboardSchema = z.object({
  employer: z.string().min(2, { message: 'Enter your employer or organization.' }),
  expertise: z.string().min(2, { message: 'List at least one area of expertise.' }),
  bio: z.string().min(10, { message: 'Add at least 10 characters to your bio.' }),
});

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  needsEmailConfirmation?: boolean;
  needsOtp?: boolean;
  phone?: string;
};

function demoAuthDisabledState(): ActionState {
  return {
    message: 'Sign-in is not available on this deployment. Join the waitlist instead.',
    success: false,
  };
}

function redirectAfterAuth(
  formData: FormData,
  session: {
    role: 'mentor' | 'mentee' | 'admin';
    onboarded?: boolean;
    activationStatus?: 'pending' | 'active';
  },
) {
  const redirectParam = formData.get('redirect');
  const fallback = getDefaultPathAfterAuth({
    role: session.role,
    onboarded: session.onboarded,
    activationStatus: session.activationStatus,
  });
  redirect(getSafeRedirectPath(redirectParam?.toString(), fallback));
}

async function redirectAfterSupabaseAuth(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const redirectParam = formData.get('redirect')?.toString() ?? '';
  const safeNext = getSafeRedirectPath(redirectParam, '/dashboard/mentee');

  if (
    !isActivationClaimNextPath(safeNext) &&
    !isActivationClaimNextPath(redirectParam) &&
    needsProfileCompletion(user)
  ) {
    redirect(
      `/auth/complete-profile?redirect=${encodeURIComponent(safeNext)}`,
    );
  }

  const session = await resolveAppSessionFromAuthUser(user);
  if (!session) {
    redirect('/auth');
  }

  redirect(
    getSafeRedirectPath(redirectParam, getDefaultPathAfterAuth(session)),
  );
}

export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isDemoAuthEnabled() && !isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = result.data;

  if (isSupabaseAuthEnabled()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('loginAction signIn:', error.message, error.code, error.status);
      return {
        message: mapSupabaseSignInError(error),
        success: false,
      };
    }
    await redirectAfterSupabaseAuth(formData);
    return { success: true };
  }

  const preset = resolvePresetLogin(email);
  let role: 'mentor' | 'mentee' | 'admin' = 'mentee';
  let fullName = '';
  // public.users.id is uuid — non-uuid ids fail ensureMenteeUserRow inserts.
  let userId: string = randomUUID();
  let isPreset = false;

  if (preset) {
    role = preset.role;
    fullName = preset.fullName;
    userId = preset.userId;
    isPreset = true;
  } else {
    const prefix = email.split('@')[0];
    fullName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    if (email.toLowerCase().includes('mentor')) {
      role = 'mentor';
    } else if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else {
      role = 'mentee';
    }
  }

  if (role === 'admin' && !isAdminEmailAllowed(email)) {
    return {
      message: 'This account is not authorized for admin access.',
      success: false,
    };
  }

  const isMentor = role === 'mentor';
  const hasOnboarded = isPreset || !isMentor;

  let sessionUserId = userId;
  if (role === 'mentee') {
    sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
  }

  // Demo cookie sessions must carry activation_status (no resolveAppSession).
  let activationStatus: 'pending' | 'active' | undefined;
  if (isMentor) {
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { data: mentorRow } = await supabaseAdmin
      .from('mentors')
      .select('activation_status')
      .eq('id', sessionUserId)
      .maybeSingle();
    activationStatus =
      mentorRow?.activation_status === 'pending' ? 'pending' : 'active';
  }

  await createSession({
    userId: sessionUserId,
    email,
    role,
    fullName,
    onboarded: hasOnboarded,
    activationStatus,
  });

  redirectAfterAuth(formData, { role, onboarded: hasOnboarded, activationStatus });
  return { success: true };
}

export async function registerAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isDemoAuthEnabled() && !isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = RegisterSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { fullName, email, password } = result.data;

  if (isSupabaseAuthEnabled()) {
    // Block open registration for emails reserved by expert invites (claim-only).
    const { supabaseAdmin } = await import('@/lib/supabase');
    const normalized = email.trim().toLowerCase();
    const { data: reserved } = await supabaseAdmin
      .from('mentors')
      .select('id')
      .eq('pending_email', normalized)
      .maybeSingle();
    if (reserved?.id) {
      return {
        message:
          'This email is reserved for expert activation. Use the invite link we sent you.',
        success: false,
      };
    }

    const supabase = await createClient();
    const redirectParam = formData.get('redirect')?.toString() ?? '';
    const safeNext = getSafeRedirectPath(redirectParam, '/dashboard/mentee');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: appAuthPath(
          `/auth/confirm?next=${encodeURIComponent(safeNext)}`,
        ),
        data: { full_name: fullName },
      },
    });

    if (error) {
      console.error('registerAction signUp:', error.message, error.code, error.status);
      return {
        message: mapSupabaseSignUpError(error),
        success: false,
      };
    }

    if (data.session) {
      await redirectAfterSupabaseAuth(formData);
      return { success: true };
    }

    return {
      success: true,
      needsEmailConfirmation: true,
      message: `We sent a confirmation link to ${email}. Click it to finish setting up your account.`,
    };
  }

  let userId: string = randomUUID();
  const preset = resolvePresetLogin(email);
  if (preset) {
    userId = preset.userId;
  }

  let sessionUserId = userId;
  if (!preset || preset.role === 'mentee') {
    sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
  }

  await createSession({
    userId: sessionUserId,
    email,
    role: 'mentee',
    fullName,
    onboarded: true,
  });

  redirectAfterAuth(formData, { role: 'mentee', onboarded: true });
  return { success: true };
}

export async function sendPhoneOtpAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = PhoneSchema.safeParse({
    phone: formData.get('phone'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: result.data.phone,
  });

  if (error) {
    return {
      message: 'Could not send verification code. Check the number and try again.',
      success: false,
    };
  }

  return {
    success: true,
    needsOtp: true,
    phone: result.data.phone,
    message: 'We sent a 6-digit code to your phone.',
  };
}

export async function verifyPhoneOtpAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = OtpSchema.safeParse({
    phone: formData.get('phone'),
    token: formData.get('token'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: result.data.phone,
    token: result.data.token,
    type: 'sms',
  });

  if (error) {
    return {
      message: 'Invalid or expired code. Request a new one and try again.',
      success: false,
    };
  }

  await redirectAfterSupabaseAuth(formData);
  return { success: true };
}

export async function signInWithXAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthEnabled()) {
    return;
  }

  const redirectParam = formData.get('redirect')?.toString() ?? '';
  const safeNext = getSafeRedirectPath(redirectParam, '/dashboard/mentee');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x',
    options: {
      redirectTo: appAuthPath(
        `/auth/callback?next=${encodeURIComponent(safeNext)}`,
      ),
    },
  });

  if (error || !data.url) {
    redirect('/auth/auth-code-error');
  }

  redirect(data.url);
}

export async function completeProfileAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = CompleteProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: result.data.email,
    data: { full_name: result.data.fullName },
  });

  if (error) {
    return {
      message: 'Could not save your profile. Check your email and try again.',
      success: false,
    };
  }

  await redirectAfterSupabaseAuth(formData);
  return { success: true };
}

export async function forgotPasswordAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const email = z.string().email().safeParse(formData.get('email'));
  if (!email.success) {
    return {
      errors: { email: ['Enter a valid email address.'] },
      success: false,
    };
  }

  const supabase = await createClient();
  // PKCE recovery links land on /auth/callback with ?code=…&next=/auth/update-password
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: appAuthPath('/auth/callback?next=/auth/update-password'),
  });

  return {
    success: true,
    message:
      'If an account exists for that email, we sent a link to reset your password. Check your inbox (and spam).',
  };
}

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'Use at least 8 characters.' }),
    confirmPassword: z.string().min(8, { message: 'Confirm your new password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export async function updatePasswordAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = UpdatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: 'This reset link is invalid or expired. Request a new one and try again.',
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      message: 'Could not update password. Request a new reset link and try again.',
      success: false,
    };
  }

  redirect('/auth?message=password-updated');
  return { success: true };
}

export async function onboardMentorAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const isCivilServant =
    formData.get('isCivilServant') === 'on' || formData.get('isCivilServant') === 'true';

  const result = OnboardSchema.safeParse({
    employer: formData.get('employer'),
    expertise: formData.get('expertise'),
    bio: formData.get('bio'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  if (isCivilServant) {
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0 || !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        errors: {
          file: ['A valid NASA Form NF-1860 PDF scan is required for federal civil servants.'],
        },
        success: false,
      };
    }
  }

  const session = await getSession();
  if (!session) {
    return {
      message: 'Active session not found. Please log in again.',
      success: false,
    };
  }

  if (isDemoAuthEnabled()) {
    await createSession({
      userId: session.userId,
      email: session.email,
      role: session.role,
      fullName: session.fullName,
      onboarded: true,
    });
  }

  redirect('/onboard/stripe-success');
  return { success: true };
}

export async function logoutAction() {
  await deleteSession();
  redirect(
    isDemoAuthEnabled() || isSupabaseAuthEnabled() ? '/auth' : WAITLIST_PUBLIC_LANDING_PATH,
  );
}