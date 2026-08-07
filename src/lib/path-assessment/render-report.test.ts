import { describe, expect, it } from 'vitest';
import {
  coercePathAssessmentReport,
  renderPathAssessmentReportHtml,
} from '@/lib/path-assessment/render-report';
import { buildFallbackPathAssessmentReport } from '@/lib/path-assessment/fallback-report';
import type { PathAssessmentReport } from '@/lib/path-assessment/schema';

const report: PathAssessmentReport = {
  headline: 'You are closer than you think',
  standing_summary: 'Strong early signals; focus the next 90 days.',
  key_gaps: [
    { title: 'Proof', detail: 'Need a mission-relevant artifact.' },
    { title: 'Network', detail: 'Open two high-signal intros.' },
  ],
  focus_areas: ['90-day plan', 'Operator conversations'],
  expert_conversation_type: 'Live path review with an aerospace operator.',
  next_actions: [
    { action: 'Write standing note', why: 'Shared map.' },
    { action: 'List questions', why: 'Protect live time.' },
    { action: 'Book live review', why: 'Attach report.' },
  ],
  upsell_bridge_live: 'Book a live expert review with my report.',
  upsell_bridge_written: 'Written review later.',
};

describe('renderPathAssessmentReportHtml', () => {
  it('escapes HTML in user/report text', () => {
    const html = renderPathAssessmentReportHtml({
      ...report,
      headline: '<script>alert(1)</script>',
      standing_summary: 'A & B < C',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B &lt; C');
  });

  it('includes live CTA with booking URL when provided', () => {
    const html = renderPathAssessmentReportHtml(report, {
      firstName: 'Alex',
      bookingUrl: 'https://astro-link.space/booking?assessment=tok',
      includeLiveCta: true,
    });
    expect(html).toContain('Book live expert review with my report');
    expect(html).toContain('https://astro-link.space/booking?assessment=tok');
    expect(html).not.toContain('$50');
  });

  it('includes written CTA when enabled with URL', () => {
    const html = renderPathAssessmentReportHtml(report, {
      bookingUrl: 'https://astro-link.space/booking?assessment=tok',
      writtenReviewUrl: 'https://astro-link.space/assessment/written-review?assessment=tok',
      includeLiveCta: true,
      includeWrittenCta: true,
    });
    expect(html).toContain('Get a written expert review — $50');
    expect(html).toContain('written-review?assessment=tok');
  });
});

describe('coercePathAssessmentReport', () => {
  it('fills missing fields from fallback', () => {
    const fallback = buildFallbackPathAssessmentReport({
      firstName: 'Alex',
      email: 'a@example.com',
      stage: 'Student',
      primaryGoal: 'Learn flight software paths in depth.',
      experience: 'Junior AE with CubeSat experience.',
      network: 'None',
      obstacle: 'No clear next project to show operators.',
    });
    const coerced = coercePathAssessmentReport({ headline: 'Custom headline only' }, fallback);
    expect(coerced.headline).toBe('Custom headline only');
    expect(coerced.standing_summary).toBe(fallback.standing_summary);
    expect(coerced.key_gaps.length).toBeGreaterThan(0);
  });
});
