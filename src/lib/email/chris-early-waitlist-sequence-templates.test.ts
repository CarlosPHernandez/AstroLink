import { describe, expect, it } from 'vitest';

import {
  CHRIS_EARLY_OFFER,
  CHRIS_EARLY_WAITLIST_CTA_URL,
  CHRIS_SEQUENCE_GREETING,
  buildChrisClickedReminderEmail,
  buildChrisFinalUrgencyEmail,
  buildChrisInitialOfferEmail,
  buildChrisSequenceEmail,
  buildChrisValueNurtureEmail,
} from '@/lib/email/chris-early-waitlist-sequence-templates';

/** Email-only contact (matches Resend early-access audience). */
const contact = { email: 'alex@example.com' };

describe('chris-early-waitlist-sequence-templates', () => {
  it('builds a compact initial offer with dual CTAs and no expand-trap patterns', () => {
    const email = buildChrisInitialOfferEmail(contact);
    expect(email.templateId).toBe('chris-initial-offer');
    expect(email.subject).toBe(
      'Your early access slot with Astronaut Chris Sembroski is now open (only 15 spots)',
    );
    expect(email.html).toContain(CHRIS_SEQUENCE_GREETING);
    expect(email.html).not.toContain('Hi Alex');
    expect(email.html).not.toContain('{{name}}');
    // No "Sent to" footer (Gmail often treats signature-like lines as trim points)
    expect(email.html).not.toContain('Sent to');
    expect(email.html).not.toContain('border-top:1px dashed');
    expect(email.html.match(/SELECT YOUR DAY AND REQUEST YOUR SESSION/g)?.length).toBe(
      2,
    );
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
    expect(email.html).toContain(CHRIS_EARLY_OFFER.priceLabel);
    expect(email.html).toContain('normally $200');
    expect(email.html).toContain('$1,500+');
    expect(email.html).toContain('15');
    expect(email.html).toContain('45-minute');
    expect(email.html).toContain('Chris Preparation Guarantee');
    expect(email.html).toContain('Inspiration4');
    expect(email.html).toContain('original waitlist');
    expect(email.html).toContain('returns to the original price');
    // Prefer staying under common mobile “clip” comfort (soft check)
    expect(email.html.length).toBeLessThan(9000);
    expect(email.text.startsWith(CHRIS_SEQUENCE_GREETING)).toBe(true);
  });

  it('builds clicked reminder under a tight word budget with dual CTAs', () => {
    const email = buildChrisClickedReminderEmail(contact);
    expect(email.templateId).toBe('chris-clicked-reminder');
    expect(email.subject).toMatch(/finish before the remaining slots close/i);
    expect(email.html).toContain(CHRIS_SEQUENCE_GREETING);
    expect(email.html.match(/SELECT YOUR DAY AND REQUEST YOUR SESSION/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    const words = email.text.split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThan(150);
  });

  it('builds value nurture with stack and dual CTAs', () => {
    const email = buildChrisValueNurtureEmail(contact);
    expect(email.templateId).toBe('chris-value-nurture');
    expect(email.subject).toMatch(/direct answers/i);
    expect(email.html).toContain(CHRIS_SEQUENCE_GREETING);
    expect(email.html).toContain('AI pre-call brief');
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('builds final urgency with full stack and guarantee', () => {
    const email = buildChrisFinalUrgencyEmail(contact);
    expect(email.templateId).toBe('chris-final-urgency');
    expect(email.subject).toMatch(/Last early access chance/i);
    expect(email.html).toContain(CHRIS_SEQUENCE_GREETING);
    expect(email.html).toContain('slots closing');
    expect(email.html).toContain('Chris Preparation Guarantee');
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('dispatches by template id and allows CTA override', () => {
    const tracked = 'https://astro-link.space/r/chris-early?e=abc';
    const email = buildChrisSequenceEmail('chris-initial-offer', {
      email: contact.email,
      ctaUrl: tracked,
    });
    expect(email.html).toContain(tracked);
    expect(email.html).not.toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('ignores name when provided (email-only audience)', () => {
    const email = buildChrisInitialOfferEmail({
      name: 'Alex Rivera',
      email: 'x@y.com',
    });
    expect(email.html).toContain(CHRIS_SEQUENCE_GREETING);
    expect(email.html).not.toContain('Alex');
  });
});
