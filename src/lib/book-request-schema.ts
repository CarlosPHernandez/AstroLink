import { z } from 'zod';
import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_SESSION_DURATION_MINUTES,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { isChrisScheduledDateBookable } from '@/lib/chris-campaign/chris-campaign-dates';
import { sanitizeEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer-sanitize';

export const BookBodySchema = z.object({
  mentorId: z.string().uuid({ message: 'Select a valid expert.' }).optional(),
  serviceType: z.enum(['session_1on1', 'pre_call_brief'], {
    message: 'Select a session type.',
  }),
  includePreCallBrief: z.boolean().optional(),
  scheduledAt: z.string().min(1, { message: 'Choose a session time.' }),
  goals: z
    .string()
    .min(10, { message: 'Add at least 10 characters so your expert can prepare.' }),
  background: z
    .string()
    .min(10, { message: 'Add at least 10 characters about your background.' }),
  // Variable duration (minutes) from UI slider for live 1:1 sessions.
  // 15 min minimum enforced client + server; prorated from mentor hourly rate.
  durationMinutes: z
    .number()
    .int()
    .min(15, { message: 'Session length must be between 15 and 120 minutes.' })
    .max(120, { message: 'Session length must be between 15 and 120 minutes.' })
    .optional(),
  campaign: z.literal(CHRIS_BOOKING_CAMPAIGN_QUERY).optional(),
  marketingReferrer: z
    .string()
    .optional()
    .transform((value) => sanitizeEarlyAccessReferrer(value)),
}).superRefine((data, ctx) => {
  if (data.campaign !== CHRIS_BOOKING_CAMPAIGN_QUERY) {
    return;
  }

  if (data.serviceType !== 'session_1on1') {
    ctx.addIssue({
      code: 'custom',
      message: 'Chris sessions are live 1:1 only.',
      path: ['serviceType'],
    });
  }

  if (
    data.durationMinutes !== undefined &&
    data.durationMinutes !== CHRIS_SESSION_DURATION_MINUTES
  ) {
    ctx.addIssue({
      code: 'custom',
      message: `Chris sessions are ${CHRIS_SESSION_DURATION_MINUTES} minutes.`,
      path: ['durationMinutes'],
    });
  }

  if (!isChrisScheduledDateBookable(data.scheduledAt)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Choose a session date on or after today.',
      path: ['scheduledAt'],
    });
  }
});

export type BookBody = z.infer<typeof BookBodySchema>;
