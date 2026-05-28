'use server';

import { createSession, deleteSession } from '@/lib/session';
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

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

// Preset credentials for easy testing
const PRESETS = {
  mentor: { email: 'peggy@astrolink.ai', fullName: 'Dr. Peggy Whitson', role: 'mentor' as const },
  mentee: { email: 'carlos@astrolink.ai', fullName: 'Carlos Hernandez', role: 'mentee' as const },
  admin: { email: 'admin@astrolink.ai', fullName: 'Flight Command', role: 'admin' as const },
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
  if (email.toLowerCase() === PRESETS.mentor.email.toLowerCase()) {
    role = PRESETS.mentor.role;
    fullName = PRESETS.mentor.fullName;
    userId = 'mentor-123';
  } else if (email.toLowerCase() === PRESETS.mentee.email.toLowerCase()) {
    role = PRESETS.mentee.role;
    fullName = PRESETS.mentee.fullName;
    userId = 'mentee-456';
  } else if (email.toLowerCase() === PRESETS.admin.email.toLowerCase()) {
    role = PRESETS.admin.role;
    fullName = PRESETS.admin.fullName;
    userId = 'admin-789';
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

  // 2. Start Session
  await createSession({
    userId,
    email,
    role,
    fullName,
  });

  // 3. Redirect
  const dashboard = role === 'admin' ? '/dashboard/admin' : role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee';
  redirect(dashboard);

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
  const userId = 'usr-' + Math.random().toString(36).substring(2, 9);

  // Start Session
  await createSession({
    userId,
    email,
    role,
    fullName,
  });

  // Redirect
  const dashboard = role === 'admin' ? '/dashboard/admin' : role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee';
  redirect(dashboard);

  return { success: true };
}

export async function logoutAction() {
  await deleteSession();
  redirect('/auth');
}
