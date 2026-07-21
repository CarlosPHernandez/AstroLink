import { z } from 'zod';

import { MENTOR_PAYOUT_METHODS } from '@/lib/mentor-activation/types';

export const InviteMentorBodySchema = z.object({
  email: z.string().email().max(200),
  expiresInHours: z.number().int().min(1).max(168).optional().default(72),
});

export const ActivationProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  title: z.string().trim().max(160).optional().default(''),
  employer: z.string().trim().min(2, 'Enter your employer or organization.').max(160),
  expertise: z.string().trim().min(2, 'List at least one area of expertise.'),
  bio: z.string().trim().min(10, 'Add at least 10 characters to your bio.').max(4000),
  rate: z.coerce
    .number()
    .int('Enter a whole-dollar hourly rate.')
    .min(0, 'Rate cannot be negative.')
    .max(10000, 'Rate must be $10,000/hr or less.'),
});

export const PayoutPreferenceSchema = z
  .object({
    payoutMethod: z.enum(MENTOR_PAYOUT_METHODS),
    payoutHandle: z.string().trim().max(200).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (
      data.payoutMethod !== 'unset' &&
      data.payoutMethod !== 'bank_manual' &&
      !data.payoutHandle?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter the account email, phone, or username for payouts.',
        path: ['payoutHandle'],
      });
    }
  });

export function parseExpertiseList(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
