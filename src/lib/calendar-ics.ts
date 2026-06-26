import type { ServiceType } from '@/lib/types';

export function bookingDurationMinutes(serviceType: ServiceType): number {
  switch (serviceType) {
    case 'extended_session':
      return 60;
    case 'session_1on1':
      return 30;
    case 'pre_call_brief':
      return 30;
  }
}

function formatIcsUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid scheduled_at for ICS: ${iso}`);
  }
  const parts = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return parts;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildBookingIcs(params: {
  uid: string;
  scheduledAt: string;
  durationMinutes: number;
  title: string;
  description: string;
  url?: string;
}): string {
  const start = new Date(params.scheduledAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid scheduled_at for ICS: ${params.scheduledAt}`);
  }
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);
  const dtStamp = formatIcsUtc(new Date().toISOString());
  const dtStart = formatIcsUtc(start.toISOString());
  const dtEnd = formatIcsUtc(end.toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AstroLink//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(params.uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    'STATUS:CONFIRMED',
  ];

  if (params.url?.trim()) {
    lines.push(`URL:${escapeIcsText(params.url.trim())}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}