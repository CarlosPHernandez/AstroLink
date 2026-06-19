import { z } from 'zod';
import { sanitizeEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer-sanitize';

export const EarlyAccessBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Enter a valid email address.' }),
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