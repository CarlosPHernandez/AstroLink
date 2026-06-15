'use server';

import {
  getDefaultPathAfterAuth,
  getSafeRedirectPath,
} from '@/lib/auth-redirect';
import { isAdminEmailAllowed, isDemoAuthEnabled } from '@/lib/app-mode';
import { resolvePresetLogin } from '@/lib/auth-presets';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { ensureMenteeUserRow } from '@/lib/user-profile';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(6, { message: 'Use at least 6 characters.' }),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, { message: 'Enter your full name.' }),
  email: z.string().email({ message: 'Enter a valid email address.' }),
  role: z.enum(['mentee', 'mentor', 'admin']),
  password: z.string().min(6, { message: 'Use at least 6 characters.' }),
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
};

function demoAuthDisabledState(): ActionState {
  return {
    message: 'Sign-in is not available on this deployment. Join the waitlist instead.',
    success: false,
  };
}

export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isDemoAuthEnabled()) {
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

  const { email } = result.data;

  const preset = resolvePresetLogin(email);
  let role: 'mentor' | 'mentee' | 'admin' = 'mentee';
  let fullName = '';
  let userId = `usr-${Math.random().toString(36).substring(2, 9)}`;
  let isPreset = false;

  if (preset) {
    role = preset.role;
    fullName = preset.fullName;
    userId = preset.userId;
    isPreset = preset.isPreset;
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

  await createSession({
    userId: sessionUserId,
    email,
    role,
    fullName,
    onboarded: hasOnboarded,
  });

  const redirectParam = formData.get('redirect');
  const fallback = getDefaultPathAfterAuth({ role, onboarded: hasOnboarded });
  redirect(getSafeRedirectPath(redirectParam?.toString(), fallback));

  return { success: true };
}

export async function registerAction(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isDemoAuthEnabled()) {
    return demoAuthDisabledState();
  }

  const result = RegisterSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { fullName, email, role } = result.data;

  if (role === 'admin' && !isAdminEmailAllowed(email)) {
    return {
      message: 'This account is not authorized for admin access.',
      success: false,
    };
  }

  let userId = `usr-${Math.random().toString(36).substring(2, 9)}`;
  const preset = resolvePresetLogin(email);
  if (preset) {
    userId = preset.userId;
  }

  const isMentor = role === 'mentor';
  let sessionUserId = userId;
  if (role === 'mentee') {
    sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
  }

  await createSession({
    userId: sessionUserId,
    email,
    role,
    fullName,
    onboarded: !isMentor,
  });

  const redirectParam = formData.get('redirect');
  const fallback = getDefaultPathAfterAuth({
    role,
    onboarded: !isMentor,
  });
  redirect(getSafeRedirectPath(redirectParam?.toString(), fallback));

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

  await createSession({
    userId: session.userId,
    email: session.email,
    role: session.role,
    fullName: session.fullName,
    onboarded: true,
  });

  redirect('/onboard/stripe-success');

  return { success: true };
}

export async function logoutAction() {
  await deleteSession();
  redirect(isDemoAuthEnabled() ? '/auth' : '/early-access');
}
