import { z } from 'zod';

export const EarlyAccessBodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Enter a valid email address' }),
  referrer: z.string().trim().max(500).optional(),
});

export type EarlyAccessBody = z.infer<typeof EarlyAccessBodySchema>;
