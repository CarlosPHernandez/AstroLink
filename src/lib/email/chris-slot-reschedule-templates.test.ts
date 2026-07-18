import { describe, expect, it } from 'vitest';

import {
  buildChrisSlotPickerUrl,
  buildChrisSlotRescheduleEmail,
  greetingLine,
} from '@/lib/email/chris-slot-reschedule-templates';

const days = [
  {
    dayKey: 'tue' as const,
    dayLabel: 'Tuesday',
    summary: 'Tuesday, Jul 21 · 12:00–4:00 PM PDT',
  },
  {
    dayKey: 'thu' as const,
    dayLabel: 'Thursday',
    summary: 'Thursday, Jul 23 · 1:00–9:00 PM PDT',
  },
  {
    dayKey: 'fri' as const,
    dayLabel: 'Friday',
    summary: 'Friday, Jul 24 · 12:00–9:00 PM PDT',
  },
];

describe('chris-slot-reschedule-templates', () => {
  it('builds a warm reschedule email with soft Monday language', () => {
    const email = buildChrisSlotRescheduleEmail({
      contact: { email: 'alex@example.com', name: 'Alex' },
      days,
      pickerBaseUrl: 'https://www.astro-link.space',
      token: 'tok.sig',
    });
    expect(email.templateId).toBe('chris-slot-reschedule');
    expect(email.subject).toMatch(/Thanks for booking Chris/i);
    expect(email.html).toContain('Hey Alex,');
    expect(email.html).toContain('excited');
    expect(email.html).toMatch(/Something came up/i);
    expect(email.html).not.toMatch(/Unfortunately Monday will not work/i);
    expect(email.html).toContain('45-minute');
    expect(email.html).toContain('/r/chris-slot?');
    expect(email.html).toContain('day=tue');
    expect(email.html).toContain('CHOOSE YOUR 45-MINUTE TIME');
    expect(email.html).toContain('The AstroLink Team');
    expect(email.text).toContain('Something came up');
  });

  it('builds picker URLs with optional day', () => {
    expect(
      buildChrisSlotPickerUrl({
        baseUrl: 'https://www.astro-link.space/',
        token: 'abc.def',
      }),
    ).toBe('https://www.astro-link.space/r/chris-slot?t=abc.def');
    expect(
      buildChrisSlotPickerUrl({
        baseUrl: 'https://www.astro-link.space',
        token: 'abc.def',
        dayKey: 'thu',
      }),
    ).toContain('day=thu');
  });

  it('greets without name when missing', () => {
    expect(greetingLine(undefined)).toBe('Hey,');
  });
});
