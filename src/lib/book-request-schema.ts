import { z } from 'zod';

export const BookBodySchema = z.object({
  mentorId: z.string().uuid().optional(),
  serviceType: z.enum(['session_1on1', 'pre_call_brief']),
  includePreCallBrief: z.boolean().optional(),
  scheduledAt: z.string().min(1),
  goals: z.string().min(10),
  background: z.string().min(10),
});

export type BookBody = z.infer<typeof BookBodySchema>;
