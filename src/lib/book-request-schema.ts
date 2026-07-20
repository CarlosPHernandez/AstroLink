import { z } from 'zod';
import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_GOALS_MIN_CHARS,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { isChrisScheduledDateBookable } from '@/lib/chris-campaign/chris-campaign-dates';
import {
  clampSessionDurationMinutes,
  SESSION_DURATION_MAX,
  SESSION_DURATION_MIN,
  SESSION_DURATION_STEP,
} from '@/lib/session-duration';
import { sanitizeEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer-sanitize';

export const BookBodySchema = z
  .object({
    mentorId: z.string().uuid({ message: 'Select a valid expert.' }).optional(),
    serviceType: z.enum(['session_1on1', 'pre_call_brief'], {
      message: 'Select a session type.',
    }),
    includePreCallBrief: z.boolean().optional(),
    scheduledAt: z.string().min(1, { message: 'Choose a session time.' }),
    goals: z.string(),
    background: z.string(),
    // Variable duration (minutes) from UI stepper for live 1:1 sessions.
    // 15 min minimum enforced client + server; prorated from mentor hourly rate (or Chris list price).
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
  })
  .superRefine((data, ctx) => {
    const isChris = data.campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
    const goalsTrim = data.goals.trim();
    const bgTrim = data.background.trim();

    if (isChris) {
      if (goalsTrim.length < CHRIS_GOALS_MIN_CHARS) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add a bit more so Chris can prepare.',
          path: ['goals'],
        });
      }
      // background optional — no min
    } else {
      if (goalsTrim.length < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add at least 10 characters so your expert can prepare.',
          path: ['goals'],
        });
      }
      if (bgTrim.length < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add at least 10 characters about your background.',
          path: ['background'],
        });
      }
    }

    if (!isChris) {
      return;
    }

    if (data.serviceType !== 'session_1on1') {
      ctx.addIssue({
        code: 'custom',
        message: 'Chris sessions are live 1:1 only.',
        path: ['serviceType'],
      });
    }

    if (data.durationMinutes !== undefined) {
      const clamped = clampSessionDurationMinutes(data.durationMinutes);
      if (
        data.durationMinutes !== clamped ||
        data.durationMinutes < SESSION_DURATION_MIN ||
        data.durationMinutes > SESSION_DURATION_MAX
      ) {
        ctx.addIssue({
          code: 'custom',
          message: `Chris sessions are ${SESSION_DURATION_MIN}–${SESSION_DURATION_MAX} minutes in ${SESSION_DURATION_STEP}-minute steps.`,
          path: ['durationMinutes'],
        });
      }
    }

    if (!isChrisScheduledDateBookable(data.scheduledAt)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Choose a session date on or after today (Wednesday–Sunday).',
        path: ['scheduledAt'],
      });
    }
  });

export type BookBody = z.infer<typeof BookBodySchema>;
