import { z } from 'zod';

export const BookBodySchema = z.object({
  mentorId: z.string().uuid().optional(),
  serviceType: z.enum(['session_1on1', 'pre_call_brief']),
  includePreCallBrief: z.boolean().optional(),
  scheduledAt: z.string().min(1),
  goals: z.string().min(10),
  background: z.string().min(10),
  // Variable duration (minutes) from UI slider for live 1:1 sessions.
  // 15 min minimum enforced client + server; prorated from mentor hourly rate.
  durationMinutes: z.number().int().min(15).max(120).optional(),
});

export type BookBody = z.infer<typeof BookBodySchema>;
