import { describe, expect, it } from 'vitest';

import {
  CHRIS_EARLY_OFFER,
  CHRIS_EARLY_WAITLIST_CTA_URL,
  buildChrisClickedReminderEmail,
  buildChrisFinalUrgencyEmail,
  buildChrisInitialOfferEmail,
  buildChrisSequenceEmail,
  buildChrisValueNurtureEmail,
} from '@/lib/email/chris-early-waitlist-sequence-templates';

const contact = { name: 'Alex Rivera', email: 'alex@example.com' };

describe('chris-early-waitlist-sequence-templates', () => {
  it('builds initial offer with offer facts, guarantee, CTA, and contact vars', () => {
    const email = buildChrisInitialOfferEmail(contact);
    expect(email.templateId).toBe('chris-initial-offer');
    expect(email.subject).toBe(
      'Your early access slot with Astronaut Chris Sembroski is now open (only 15 spots)',
    );
    expect(email.html).toContain('Alex Rivera');
    expect(email.html).toContain('alex@example.com');
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
    expect(email.html).toContain('Select Your Day and Request Your Session');
    expect(email.html).toContain(CHRIS_EARLY_OFFER.priceLabel);
    expect(email.html).toContain('15');
    expect(email.html).toContain('45-minute');
    expect(email.html).toContain('Chris Preparation Guarantee');
    expect(email.html).toContain('Inspiration4');
    expect(email.text).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('builds clicked reminder under a tight word budget', () => {
    const email = buildChrisClickedReminderEmail(contact);
    expect(email.templateId).toBe('chris-clicked-reminder');
    expect(email.subject).toMatch(/finish before the remaining slots close/i);
    const words = email.text.split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThan(150);
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('builds value nurture with stack and social line', () => {
    const email = buildChrisValueNurtureEmail(contact);
    expect(email.templateId).toBe('chris-value-nurture');
    expect(email.subject).toMatch(/direct answers/i);
    expect(email.html).toContain('Requests are coming in daily');
    expect(email.html).toContain('AI pre-call brief');
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('builds final urgency with full stack and guarantee', () => {
    const email = buildChrisFinalUrgencyEmail(contact);
    expect(email.templateId).toBe('chris-final-urgency');
    expect(email.subject).toMatch(/Last early access chance/i);
    expect(email.html).toContain('slots closing');
    expect(email.html).toContain('Chris Preparation Guarantee');
    expect(email.html).toContain('3 resources');
    expect(email.html).toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('dispatches by template id and allows CTA override', () => {
    const tracked = 'https://astro-link.space/r/chris-early?e=abc';
    const email = buildChrisSequenceEmail('chris-initial-offer', {
      ...contact,
      ctaUrl: tracked,
    });
    expect(email.html).toContain(tracked);
    expect(email.html).not.toContain(CHRIS_EARLY_WAITLIST_CTA_URL);
  });

  it('falls back to there when name empty', () => {
    const email = buildChrisInitialOfferEmail({ name: '  ', email: 'x@y.com' });
    expect(email.html).toContain('Hi there');
  });
});
