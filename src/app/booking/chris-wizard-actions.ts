'use server';

import { randomUUID } from 'crypto';
import { isDemoAuthEnabled, isSupabaseAuthEnabled } from '@/lib/app-mode';
import { resolvePresetLogin } from '@/lib/auth-presets';
import { createSession } from '@/lib/session';
import {
  mapSupabaseSignInError,
  mapSupabaseSignUpError,
} from '@/lib/supabase/auth-error-message';
import { createClient } from '@/lib/supabase/server';
import { ensureMenteeUserRow } from '@/lib/user-profile';
import { z } from 'zod';

const RegisterSchema = z.object({
  fullName: z.string().min(2, { message: 'Enter your full name.' }),
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Use at least 8 characters.' }),
});

const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Use at least 8 characters.' }),
});

export type ChrisWizardAuthState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  needsEmailConfirmation?: boolean;
};

function demoAuthDisabledState(): ChrisWizardAuthState {
  return {
    message: 'Sign-in is not available on this deployment.',
    success: false,
  };
}

/** Register inside the Chris wizard — no redirect; client calls router.refresh(). */
export async function chrisWizardRegisterAction(
  _prev: ChrisWizardAuthState | undefined,
  formData: FormData,
): Promise<ChrisWizardAuthState> {
  if (!isDemoAuthEnabled() && !isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = RegisterSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors, success: false };
  }

  const { fullName, email, password } = result.data;

  if (isSupabaseAuthEnabled()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      console.error('chrisWizardRegisterAction signUp:', error.message, error.code, error.status);
      return {
        message: mapSupabaseSignUpError(error),
        success: false,
      };
    }

    if (!data.session) {
      return {
        success: true,
        needsEmailConfirmation: true,
        message: `We sent a confirmation link to ${email}. Click it, then return here to continue.`,
      };
    }

    return { success: true };
  }

  // public.users.id is uuid — never use non-uuid demo ids (insert fails).
  let userId: string = randomUUID();
  const preset = resolvePresetLogin(email);
  if (preset) {
    userId = preset.userId;
  }

  try {
    const sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
    await createSession({
      userId: sessionUserId,
      email,
      role: 'mentee',
      fullName,
      onboarded: true,
    });
  } catch (err) {
    console.error('chrisWizardRegisterAction profile:', err);
    return {
      message: 'Could not create your account profile. Try signing in or use a different email.',
      success: false,
    };
  }

  return { success: true };
}

/** Sign in inside the Chris wizard — no redirect; client calls router.refresh(). */
export async function chrisWizardLoginAction(
  _prev: ChrisWizardAuthState | undefined,
  formData: FormData,
): Promise<ChrisWizardAuthState> {
  if (!isDemoAuthEnabled() && !isSupabaseAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors, success: false };
  }

  const { email, password } = result.data;

  if (isSupabaseAuthEnabled()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('chrisWizardLoginAction signIn:', error.message, error.code, error.status);
      return { message: mapSupabaseSignInError(error), success: false };
    }
    return { success: true };
  }

  const preset = resolvePresetLogin(email);
  if (!preset) {
    return { message: 'Invalid email or password.', success: false };
  }

  try {
    const sessionUserId =
      preset.role === 'mentee'
        ? await ensureMenteeUserRow({
            userId: preset.userId,
            email,
            fullName: preset.fullName,
          })
        : preset.userId;

    await createSession({
      userId: sessionUserId,
      email,
      role: preset.role,
      fullName: preset.fullName,
      onboarded: preset.role !== 'mentor',
    });
  } catch (err) {
    console.error('chrisWizardLoginAction profile:', err);
    return {
      message: 'Could not load your account profile. Try again or use another account.',
      success: false,
    };
  }

  return { success: true };
}
