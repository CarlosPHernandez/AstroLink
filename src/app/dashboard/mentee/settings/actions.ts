'use server';

import { createSession, getSession } from '@/lib/session';
import {
  getMenteeProfile,
  updateMenteeProfile,
  type MenteeProfileUpdate,
} from '@/lib/user-profile';
import { z } from 'zod';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || E164_REGEX.test(v), {
      message: 'Phone must be E.164 format (e.g. +14155552671)',
    }),
  bio: z.string().max(2000, 'Bio is too long'),
});

export type SettingsActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function updateProfileAction(
  _prev: SettingsActionState | undefined,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session || session.role !== 'mentee') {
    return { message: 'You must be signed in as a buyer.', success: false };
  }

  const parsed = ProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    bio: formData.get('bio'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      success: false,
    };
  }

  const update: MenteeProfileUpdate = {
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    bio: parsed.data.bio,
  };

  const profile = await updateMenteeProfile(session.userId, update);
  if (!profile) {
    return { message: 'Could not save profile. Try again.', success: false };
  }

  await createSession({
    userId: session.userId,
    email: profile.email,
    role: session.role,
    fullName: profile.fullName,
    onboarded: session.onboarded,
  });

  return { success: true, message: 'Profile saved.' };
}

export async function loadMenteeProfileForSettings() {
  const session = await getSession();
  if (!session || session.role !== 'mentee') {
    return null;
  }
  return getMenteeProfile(session.userId);
}
