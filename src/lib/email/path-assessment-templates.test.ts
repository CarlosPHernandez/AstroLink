import { describe, expect, it, vi } from 'vitest';
import { buildPathAssessmentEmail } from '@/lib/email/path-assessment-templates';
import type { PathAssessmentReport } from '@/lib/path-assessment/schema';

vi.mock('@/lib/app-url', () => ({
  getAppBaseUrl: () => 'https://astro-link.space',
}));

const report: PathAssessmentReport = {
  headline: 'You are closer than you think',
  standing_summary: 'Strong early signals.',
  key_gaps: [{ title: 'Proof', detail: 'Need an artifact.' }],
  focus_areas: ['90-day plan'],
  expert_conversation_type: 'Live path review.',
  next_actions: [{ action: 'Book live review', why: 'Attach report.' }],
  upsell_bridge_live: 'Book a live expert review.',
  upsell_bridge_written: 'Written review later.',
};

describe('buildPathAssessmentEmail', () => {
  it('names the matched expert and deep-links to that mentor', () => {
    const email = buildPathAssessmentEmail({
      firstName: 'Ada',
      token: 'a'.repeat(64),
      report,
      mentorName: 'Chris Sembroski',
      mentorSlug: 'chris-sembroski',
    });
    expect(email.html).toContain('Book Chris Sembroski');
    expect(email.html).toContain('mentor=chris-sembroski');
  });

  it('does not invent an expert name when Gemini did not match', () => {
    const email = buildPathAssessmentEmail({
      firstName: 'Ada',
      token: 'b'.repeat(64),
      report,
    });
    expect(email.html).toContain('Book a live session — Gemini matches you');
    expect(email.html).not.toContain('mentor=');
  });
});
