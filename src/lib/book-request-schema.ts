import { z } from 'zod';
import {
  BOOKING_LEAD_TIME_ERROR,
  isScheduledAtOnOrAfterEarliestBookable,
} from '@/lib/booking-lead-time';
import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  CHRIS_GOALS_MIN_CHARS,
} from '@/lib/chris-campaign/chris-campaign-constants';
import { isChrisScheduledDateBookable } from '@/lib/chris-campaign/chris-campaign-dates';
import { OFFER_SLUG_RE } from '@/lib/expert-offers/constants';
import {
  clampSessionDurationMinutes,
  SESSION_DURATION_MAX,
  SESSION_DURATION_MIN,
  SESSION_DURATION_STEP,
} from '@/lib/session-duration';
import { GUEST_INVITE_DURATION_MINUTES } from '@/lib/guest-invite-constants';
import { sanitizeEarlyAccessReferrer } from '@/lib/waitlist/early-access-referrer-sanitize';

export const BookBodySchema = z
  .object({
    mentorId: z.string().uuid({ message: 'Select a valid expert.' }).optional(),
    serviceType: z
      .enum(['session_1on1', 'pre_call_brief', 'packaged_offer'], {
        message: 'Select a session type.',
      })
      .optional(),
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
    /** Single-use complimentary 15-min grant id (server validates ownership). */
    applyCompGrantId: z.string().uuid().optional(),
    /** Claimed email-locked guest invite. Forces a 25-minute Chris session at $0. */
    guestInviteId: z.string().uuid().optional(),
    /** Space Path Assessment public token — attaches report context to the booking. */
    assessmentToken: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, { message: 'Invalid assessment reference.' })
      .optional(),
    offerSlug: z
      .string()
      .regex(OFFER_SLUG_RE, { message: 'Invalid offer.' })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const isChris = data.campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
    const goalsTrim = data.goals.trim();
    const bgTrim = data.background.trim();

    if (data.serviceType === 'packaged_offer' && !data.offerSlug) {
      ctx.addIssue({
        code: 'custom',
        message: 'Packaged sessions must be booked from their share link.',
        path: ['serviceType'],
      });
    }

    if (data.offerSlug) {
      if (!data.mentorId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a valid expert.',
          path: ['mentorId'],
        });
      }
      if (data.serviceType && data.serviceType !== 'packaged_offer') {
        ctx.addIssue({
          code: 'custom',
          message: 'Packaged sessions cannot mix with another session type.',
          path: ['serviceType'],
        });
      }
      if (isChris) {
        ctx.addIssue({
          code: 'custom',
          message: 'This session is booked from its share link, not the campaign checkout.',
          path: ['offerSlug'],
        });
      }
      if (data.applyCompGrantId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Complimentary sessions do not apply to packaged offers.',
          path: ['applyCompGrantId'],
        });
      }
    } else if (!data.serviceType) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a session type.',
        path: ['serviceType'],
      });
    }

    if (data.applyCompGrantId) {
      if (data.serviceType !== 'session_1on1') {
        ctx.addIssue({
          code: 'custom',
          message: 'Complimentary session only applies to live 1:1 bookings.',
          path: ['applyCompGrantId'],
        });
      }
      if (data.durationMinutes != null && data.durationMinutes !== 15) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Complimentary session only applies to 15-minute bookings. Longer sessions are full price.',
          path: ['durationMinutes'],
        });
      }
    }

    if (data.guestInviteId && data.applyCompGrantId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Choose one complimentary offer.',
        path: ['guestInviteId'],
      });
    }

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

    // All bookings: 2 calendar-day lead in platform timezone (today + tomorrow blocked).
    const meetsLead = isScheduledAtOnOrAfterEarliestBookable(data.scheduledAt);
    if (!meetsLead) {
      ctx.addIssue({
        code: 'custom',
        message: BOOKING_LEAD_TIME_ERROR,
        path: ['scheduledAt'],
      });
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

    if (data.guestInviteId) {
      if (data.durationMinutes !== GUEST_INVITE_DURATION_MINUTES) {
        ctx.addIssue({
          code: 'custom',
          message: 'This invite is a 25-minute session.',
          path: ['durationMinutes'],
        });
      }
    } else if (data.durationMinutes !== undefined) {
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

    // Chris: Wed–Sun + campaign start (lead days already inside min helper).
    // Skip if lead already failed so we don't double-message the same field.
    if (meetsLead && !isChrisScheduledDateBookable(data.scheduledAt)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Choose a session date at least 2 days from today (Wednesday–Sunday).',
        path: ['scheduledAt'],
      });
    }
  });

export type BookBody = z.infer<typeof BookBodySchema>;
