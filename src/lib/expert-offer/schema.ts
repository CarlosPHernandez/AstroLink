import { z } from 'zod';

export const OFFERED_SERVICE_IDS = ['session_1on1', 'pre_call_brief', 'extended_session'] as const;

export const MAX_WINDOWS = 14;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const AvailabilityWindowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1440),
    endMinute: z.number().int().min(0).max(1440),
  })
  .refine(
    (window) =>
      window.startMinute < window.endMinute && window.endMinute - window.startMinute >= 60,
    { message: 'A window must be at least 60 minutes and cannot cross midnight.' },
  );

export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;

const OfferedServiceSchema = z.enum(OFFERED_SERVICE_IDS);

export const VideoRequestSchema = z.discriminatedUnion('enabled', [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    priceCents: z.number().int().min(2500).max(50000),
    slaDays: z.number().int().min(3).max(14),
  }),
]);

export type VideoRequest = z.infer<typeof VideoRequestSchema>;

function isIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

const offerFields = {
  hourlyRateDollars: z.number().int().min(1).max(10000),
  services: z
    .array(OfferedServiceSchema)
    .max(3)
    .refine((services) => new Set(services).size === services.length, {
      message: 'Choose each service once.',
    }),
  videoRequest: VideoRequestSchema,
  timezone: z.string().refine(isIanaTimeZone, { message: 'Choose a valid timezone.' }),
  windows: z.array(AvailabilityWindowSchema).max(MAX_WINDOWS),
};

/** Live offer. Windows may be empty so a mentor can clear hours. */
export const MentorOfferSchema = z.object(offerFields);

export type MentorOffer = z.infer<typeof MentorOfferSchema>;

export const ExpertApplicationSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email().max(120),
    employer: z.string().min(2).max(120),
    expertise: z.string().min(2).max(200),
    bio: z.string().min(10).max(2000),
    isCivilServant: z.boolean(),
    ...offerFields,
    windows: z.array(AvailabilityWindowSchema).min(1).max(MAX_WINDOWS),
  })
  .superRefine((data, ctx) => {
    const offers = data.services.length + (data.videoRequest.enabled ? 1 : 0);
    if (offers < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Choose a live service or a video review.',
        path: ['services'],
      });
    }
  });

export type ExpertApplication = z.infer<typeof ExpertApplicationSchema>;

function localStart(scheduledAtIso: string, timeZone: string): { weekday: number; minute: number } | null {
  const scheduledAt = new Date(scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) return null;

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(scheduledAt);
  } catch {
    return null;
  }

  const weekdayLabel = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  const weekday = WEEKDAY_LABELS.indexOf(weekdayLabel as (typeof WEEKDAY_LABELS)[number]);
  if (weekday < 0 || !Number.isInteger(hour) || !Number.isInteger(minute)) return null;

  return { weekday, minute: hour * 60 + minute };
}

/** True when the session starts and ends inside one saved window. Midnight-crossing sessions do not match. */
export function windowContains(
  windows: readonly Pick<AvailabilityWindow, 'weekday' | 'startMinute' | 'endMinute'>[],
  timezone: string,
  scheduledAtIso: string,
  durationMinutes: number,
): boolean {
  if (!Number.isFinite(durationMinutes)) return false;
  const start = localStart(scheduledAtIso, timezone);
  if (!start) return false;

  const end = start.minute + durationMinutes;
  if (end > 1440) return false;

  return windows.some(
    (window) =>
      window.weekday === start.weekday &&
      window.startMinute <= start.minute &&
      end <= window.endMinute,
  );
}
