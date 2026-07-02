import { z } from 'zod';
import { sanitizeEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer-sanitize';
import {
  isPermissiveEmailAddress,
  normalizeWaitlistEmail,
  WAITLIST_EMAIL_ERROR,
  WAITLIST_EMAIL_MAX_LENGTH,
} from '@/lib/waitlist/permissive-email';

export const EarlyAccessBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(WAITLIST_EMAIL_MAX_LENGTH, { message: WAITLIST_EMAIL_ERROR })
      .transform(normalizeWaitlistEmail)
      .refine(isPermissiveEmailAddress, { message: WAITLIST_EMAIL_ERROR }),
    referrer: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value ? sanitizeEarlyAccessReferrer(value) : undefined)),
    /** Honeypot — must stay empty; bots often fill visible-hidden fields. */
    company: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.company?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid submission.',
        path: ['company'],
      });
    }
  });

export type EarlyAccessBody = z.infer<typeof EarlyAccessBodySchema>;