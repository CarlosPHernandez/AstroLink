import { describe, expect, it } from 'vitest';

import {
  CHRIS_INCOMPLETE_BOOKING_CTA_URL,
  buildChrisIncompleteBookingEmail,
  firstNameFromContact,
  greetingLine,
} from '@/lib/email/chris-incomplete-booking-templates';

const contact = { email: 'alex@example.com' };

describe('chris-incomplete-booking-templates', () => {
  it('builds a personal check-in with CTA and help options', () => {
    const email = buildChrisIncompleteBookingEmail(contact);
    expect(email.templateId).toBe('chris-incomplete-booking');
    expect(email.subject).toBe('Quick check-in on your session with Chris');
    expect(email.html).toContain('Hey,');
    expect(email.html).toContain('started booking');
    expect(email.html).toContain('didn’t complete');
    expect(email.html).toContain('Reply to this email');
    expect(email.html).toContain('FINISH BOOKING YOUR SESSION');
    expect(email.html).toContain(CHRIS_INCOMPLETE_BOOKING_CTA_URL);
    expect(email.html).toContain('45-minute');
    expect(email.html).toContain('The AstroLink Team');
    expect(email.html).toContain('No pressure');
    // Waitlist scarcity UI should not appear on this ops check-in
    expect(email.html).not.toContain('Early access · 15 slots');
    expect(email.html).not.toContain('{{name}}');
    expect(email.html).not.toContain('Sent to');
    expect(email.html.length).toBeLessThan(7000);
    expect(email.text.startsWith('Hey,')).toBe(true);
    expect(email.text).toContain(CHRIS_INCOMPLETE_BOOKING_CTA_URL);
  });

  it('personalizes greeting when a real name is provided', () => {
    const email = buildChrisIncompleteBookingEmail({
      email: contact.email,
      name: 'Alex Rivera',
    });
    expect(email.html).toContain('Hey Alex,');
    expect(email.html).not.toContain('Hey Rivera');
    expect(email.text.startsWith('Hey Alex,')).toBe(true);
  });

  it('ignores email-like names', () => {
    expect(firstNameFromContact('alex@example.com')).toBeNull();
    expect(greetingLine('alex@example.com')).toBe('Hey,');
  });

  it('allows CTA override for early-signups pricing', () => {
    const early =
      'https://www.astro-link.space/talk-with-chris?ref=early-signups';
    const email = buildChrisIncompleteBookingEmail({
      email: contact.email,
      ctaUrl: early,
    });
    expect(email.html).toContain(early);
    expect(email.html).not.toContain(CHRIS_INCOMPLETE_BOOKING_CTA_URL);
    expect(email.text).toContain(early);
  });
});
