import { describe, expect, it } from 'vitest';
import { getExpertWaitlistCtaHref, resolveExpertCta } from '@/lib/expert-cta';

describe('resolveExpertCta', () => {
  it('returns waitlist early-access link in waitlist mode', () => {
    const cta = resolveExpertCta('chris-sembroski', false, true);
    expect(cta.variant).toBe('waitlist');
    expect(cta.href).toBe(getExpertWaitlistCtaHref('chris-sembroski'));
  });

  it('returns booking path in full mode when signed in', () => {
    const cta = resolveExpertCta('chris-sembroski', true, false);
    expect(cta.variant).toBe('booking');
    expect(cta.href).toBe('/booking?mentor=chris-sembroski');
  });

  it('returns auth redirect in full mode when signed out', () => {
    const cta = resolveExpertCta('chris-sembroski', false, false);
    expect(cta.href).toContain('/auth?redirect=');
  });
});