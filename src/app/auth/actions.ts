'use server';

import {
  getDefaultPathAfterAuth,
  getSafeRedirectPath,
} from '@/lib/auth-redirect';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { ensureMenteeUserRow } from '@/lib/user-profile';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['mentee', 'mentor', 'admin']),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const OnboardSchema = z.object({
  employer: z.string().min(2, { message: 'Employer name must be at least 2 characters' }),
  expertise: z.string().min(2, { message: 'Please specify expertise fields' }),
  bio: z.string().min(10, { message: 'Bio must be at least 10 characters' }),
});

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

// Preset credentials for easy testing
/** Match `supabase/migrations/20260531140100_seed_d1_dev.sql` until Supabase Auth ships */
const PRESETS = {
  mentor: {
    email: 'chris@astrolink.ai',
    fullName: 'Chris Sembroski',
    role: 'mentor' as const,
    userId: 'a0000002-0000-4000-8000-000000000002',
  },
  mentee: {
    email: 'carlos@astrolink.ai',
    fullName: 'Carlos Hernandez',
    role: 'mentee' as const,
    userId: 'a0000001-0000-4000-8000-000000000001',
  },
  admin: {
    email: 'admin@astrolink.ai',
    fullName: 'Flight Command',
    role: 'admin' as const,
    userId: 'a0000003-0000-4000-8000-000000000003',
  },
};

export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
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
  
  // 1. Identify User Role and Details
  let role: 'mentor' | 'mentee' | 'admin' = 'mentee';
  let fullName = '';
  let userId = 'usr-' + Math.random().toString(36).substring(2, 9);

  // Check presets
  const isPreset = 
    email.toLowerCase() === PRESETS.mentor.email.toLowerCase() ||
    email.toLowerCase() === PRESETS.mentee.email.toLowerCase() ||
    email.toLowerCase() === PRESETS.admin.email.toLowerCase();

  if (email.toLowerCase() === PRESETS.mentor.email.toLowerCase()) {
    role = PRESETS.mentor.role;
    fullName = PRESETS.mentor.fullName;
    userId = PRESETS.mentor.userId;
  } else if (email.toLowerCase() === PRESETS.mentee.email.toLowerCase()) {
    role = PRESETS.mentee.role;
    fullName = PRESETS.mentee.fullName;
    userId = PRESETS.mentee.userId;
  } else if (email.toLowerCase() === PRESETS.admin.email.toLowerCase()) {
    role = PRESETS.admin.role;
    fullName = PRESETS.admin.fullName;
    userId = PRESETS.admin.userId;
  } else {
    // Generate name from email prefix
    const prefix = email.split('@')[0];
    fullName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    
    // Auto-detect role for test entries
    if (email.toLowerCase().includes('mentor')) {
      role = 'mentor';
    } else if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else {
      role = 'mentee';
    }
  }

  const isMentor = role === 'mentor';
  const hasOnboarded = isPreset || !isMentor;

  let sessionUserId = userId;
  if (role === 'mentee') {
    sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
  }

  // 2. Start Session
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
  formData: FormData
): Promise<ActionState> {
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
  let userId = 'usr-' + Math.random().toString(36).substring(2, 9);

  const emailLower = email.toLowerCase();
  if (emailLower === PRESETS.mentee.email.toLowerCase()) {
    userId = PRESETS.mentee.userId;
  } else if (emailLower === PRESETS.mentor.email.toLowerCase()) {
    userId = PRESETS.mentor.userId;
  } else if (emailLower === PRESETS.admin.email.toLowerCase()) {
    userId = PRESETS.admin.userId;
  }

  const isMentor = role === 'mentor';
  let sessionUserId = userId;
  if (role === 'mentee') {
    sessionUserId = await ensureMenteeUserRow({ userId, email, fullName });
  }

  // Start Session
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
  formData: FormData
): Promise<ActionState> {
  const isCivilServant = formData.get('isCivilServant') === 'on' || formData.get('isCivilServant') === 'true';

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

  // Validate PDF file if civil servant
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

  // Retrieve current session
  const session = await getSession();
  if (!session) {
    return {
      message: 'Active session not found. Please log in again.',
      success: false,
    };
  }

  // Update session to set onboarded: true
  await createSession({
    userId: session.userId,
    email: session.email,
    role: session.role,
    fullName: session.fullName,
    onboarded: true,
  });

  // Redirect to Stripe simulated onboarding success screen
  redirect('/onboard/stripe-success');

  return { success: true };
}

export async function logoutAction() {
  await deleteSession();
  redirect('/auth');
}
