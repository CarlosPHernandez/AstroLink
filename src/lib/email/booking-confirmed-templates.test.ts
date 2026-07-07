import { describe, expect, it, vi } from 'vitest';
import { buildMenteeConfirmationEmail } from '@/lib/email/booking-confirmed-templates';

vi.mock('@/lib/app-url', () => ({
  getAppBaseUrl: () => 'https://astro-link.space',
}));

const baseContext = {
  bookingId: 'booking-1',
  scheduledAt: '2026-07-01T18:00:00.000Z',
  serviceType: 'session_1on1' as const,
  matchReason: 'Learn about cubesat propulsion',
  briefingJson: null,
  dailyRoomUrl: 'https://daily.example/room',
  campaignId: null,
  durationMinutes: 30,
  menteeName: 'Carlos',
  menteeEmail: 'carlos@example.com',
  mentorName: 'Chris Sembroski',
  mentorEmail: 'chris@example.com',
};

describe('buildMenteeConfirmationEmail', () => {
  it('keeps non-Chris confirmation time, UTC disclaimer, service label, and calendar attachment', () => {
    const email = buildMenteeConfirmationEmail(baseContext);

    expect(email.subject).toBe("You're booked with Chris Sembroski");
    expect(email.html).toContain('6:00 PM UTC');
    expect(email.html).toContain('Expert session (30 min)');
    expect(email.html).toContain('Times shown in UTC');
    expect(email.attachment?.filename).toBe('astrolink-session.ics');
  });

  it('renders Chris campaign confirmation as a date-only Admit One ticket with no calendar attachment', () => {
    const email = buildMenteeConfirmationEmail({
      ...baseContext,
      campaignId: 'chris-sembroski',
      durationMinutes: 45,
    });

    expect(email.html).toContain('Admit One');
    expect(email.html).toContain("You're booked with Chris Sembroski");
    expect(email.html).toContain('src="https://astro-link.space/chris_sembroski.webp"');
    expect(email.html).toContain('alt="Chris Sembroski"');
    expect(email.html).toContain('Inspiration4 astronaut');
    expect(email.html).toContain('Date reserved');
    expect(email.html).toContain('background:#1c1c1c');
    expect(email.html).toContain('color:#b4c5ff');
    expect(email.html).toContain('font-family:Geist,Inter,Arial,Helvetica,sans-serif');
    expect(email.html).not.toContain('background:#f4f0e8');
    expect(email.html).not.toContain('background:#fffdf8');
    expect(email.html).not.toContain('space systems');
    expect(email.html).toContain('Wednesday, July 1');
    expect(email.html).toContain('45-minute session with Chris Sembroski');
    expect(email.html).toContain("You'll be able to select a time once Chris confirms availability");
    expect(email.html).not.toContain('6:00 PM');
    expect(email.html).not.toContain('UTC');
    expect(email.html).not.toContain('Expert session (30 min)');
    expect(email.attachment).toBeUndefined();
  });
});
