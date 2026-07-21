'use server';

import { isSupabaseAuthEnabled } from '@/lib/app-mode';
import { ChangeMentorPasswordSchema } from '@/lib/mentor-activation/schemas';
import { requireActivatedMentor } from '@/lib/mentor-activation/require-activated-mentor';
import {
  getMentorProfileRow,
  recordMentorNf1860Upload,
  updateMentorProfile,
} from '@/lib/mentor-profile';
import { validateNf1860PdfBuffer, validateNf1860PdfFile } from '@/lib/nf1860-upload';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ProfileSchema = z.object({
  rate: z.coerce
    .number()
    .int('Enter a whole-dollar hourly rate.')
    .min(1, 'Rate must be at least $1/hr.')
    .max(10000, 'Rate must be $10,000/hr or less.'),
  employer: z.string().min(2, 'Enter your employer or organization.'),
  expertise: z.string().min(2, 'List at least one area of expertise.'),
  bio: z.string().min(10, 'Add at least 10 characters to your bio.'),
  isCivilServant: z
    .preprocess(
      (value) => (value === null ? undefined : value),
      z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    ),
});

export type MentorProfileActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

function parseExpertise(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateMentorProfileAction(
  _prev: MentorProfileActionState | undefined,
  formData: FormData,
): Promise<MentorProfileActionState> {
  const gate = await requireActivatedMentor();
  if (!gate.ok) {
    return { message: gate.message, success: false };
  }
  const session = gate.session;

  const parsed = ProfileSchema.safeParse({
    rate: formData.get('rate'),
    employer: formData.get('employer'),
    expertise: formData.get('expertise'),
    bio: formData.get('bio'),
    isCivilServant: formData.get('isCivilServant'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      success: false,
    };
  }

  const expertise = parseExpertise(parsed.data.expertise);
  if (expertise.length === 0) {
    return {
      errors: { expertise: ['List at least one area of expertise.'] },
      success: false,
    };
  }

  const updated = await updateMentorProfile(session.userId, {
    employer: parsed.data.employer,
    expertise,
    bio: parsed.data.bio,
    liveSessionPriceCents: parsed.data.rate * 100,
    isCivilServant: parsed.data.isCivilServant,
  });

  if (!updated) {
    const existing = await getMentorProfileRow(session.userId);
    if (!existing) {
      return {
        message: 'Complete mentor onboarding before saving your public profile.',
        success: false,
      };
    }
    return { message: 'Could not save profile. Try again.', success: false };
  }

  return { success: true, message: 'Profile saved.' };
}

export async function uploadMentorNf1860Action(
  _prev: MentorProfileActionState | undefined,
  formData: FormData,
): Promise<MentorProfileActionState> {
  const gate = await requireActivatedMentor();
  if (!gate.ok) {
    return { message: gate.message, success: false };
  }
  const session = gate.session;

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return {
      errors: { file: ['Choose a PDF to upload.'] },
      success: false,
    };
  }

  const fileValidation = validateNf1860PdfFile(file);
  if (!fileValidation.ok) {
    return {
      errors: { file: [fileValidation.message] },
      success: false,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bufferValidation = validateNf1860PdfBuffer(buffer);
  if (!bufferValidation.ok) {
    return {
      errors: { file: [bufferValidation.message] },
      success: false,
    };
  }
  const result = await recordMentorNf1860Upload(session.userId, buffer);

  if (!result) {
    return {
      message: 'Could not upload document. Try again.',
      success: false,
    };
  }

  return {
    success: true,
    message: 'Document uploaded for compliance review.',
  };
}

/**
 * Change password for an activated mentor (session required).
 * Verifies current password, then updates via Supabase Auth.
 */
export async function changeMentorPasswordAction(
  _prev: MentorProfileActionState | undefined,
  formData: FormData,
): Promise<MentorProfileActionState> {
  const gate = await requireActivatedMentor();
  if (!gate.ok) {
    return { message: gate.message, success: false };
  }

  if (!isSupabaseAuthEnabled()) {
    return {
      success: true,
      message: 'Password change is not available in demo auth mode.',
    };
  }

  const parsed = ChangeMentorPasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      success: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      message: 'Your session expired. Sign in again and try changing your password.',
      success: false,
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      errors: { currentPassword: ['Current password is incorrect.'] },
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error('changeMentorPasswordAction:', error.message);
    return {
      message: 'Could not update password. Try a different password or try again.',
      success: false,
    };
  }

  return { success: true, message: 'Password updated.' };
}
