import { describe, expect, it } from 'vitest';

import { bookingDurationMinutes, buildBookingIcs } from '@/lib/calendar-ics';

describe('bookingDurationMinutes', () => {
  it('maps service types to session length', () => {
    expect(bookingDurationMinutes('session_1on1')).toBe(30);
    expect(bookingDurationMinutes('extended_session')).toBe(60);
    expect(bookingDurationMinutes('pre_call_brief')).toBe(30);
  });
});

describe('buildBookingIcs', () => {
  it('emits a valid VEVENT with UTC timestamps', () => {
    const ics = buildBookingIcs({
      uid: 'booking-1@astrolink.ai',
      scheduledAt: '2026-07-01T18:00:00.000Z',
      durationMinutes: 30,
      title: 'AstroLink session',
      description: 'Buyer goals here',
      url: 'https://astro-link.space/dashboard/mentee',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:booking-1@astrolink.ai');
    expect(ics).toContain('DTSTART:20260701T180000Z');
    expect(ics).toContain('DTEND:20260701T183000Z');
    expect(ics).toContain('SUMMARY:AstroLink session');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});