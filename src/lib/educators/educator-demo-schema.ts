import { z } from 'zod';
import {
  isPermissiveEmailAddress,
  normalizeWaitlistEmail,
  WAITLIST_EMAIL_ERROR,
  WAITLIST_EMAIL_MAX_LENGTH,
} from '@/lib/waitlist/permissive-email';

export const EDUCATOR_ROLES = [
  'Teacher',
  'Counselor / advisor',
  'Administrator',
  'Career services',
  'Other',
] as const;

export type EducatorRole = (typeof EDUCATOR_ROLES)[number];

export const EducatorDemoRequestSchema = z
  .object({
    fullName: z.string().trim().min(1, { message: 'Enter your name.' }).max(200),
    email: z
      .string()
      .trim()
      .max(WAITLIST_EMAIL_MAX_LENGTH, { message: WAITLIST_EMAIL_ERROR })
      .transform(normalizeWaitlistEmail)
      .refine(isPermissiveEmailAddress, { message: WAITLIST_EMAIL_ERROR }),
    schoolName: z.string().trim().min(1, { message: 'Enter your school or program name.' }).max(200),
    role: z.enum(EDUCATOR_ROLES, { message: 'Choose a role.' }),
    studentPopulation: z.string().trim().max(100).optional(),
    message: z.string().trim().max(2000).optional(),
    referrer: z.string().trim().max(500).optional(),
    /** Honeypot — must stay empty; bots often fill visible-hidden fields. */
    company: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.company?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Invalid submission.', path: ['company'] });
    }
  });

export type EducatorDemoRequestBody = z.infer<typeof EducatorDemoRequestSchema>;
