import { describe, expect, it } from 'vitest';
import { buildFallbackPathAssessmentReport } from '@/lib/path-assessment/fallback-report';
import { PathAssessmentReportSchema } from '@/lib/path-assessment/schema';

describe('buildFallbackPathAssessmentReport', () => {
  it('returns a schema-valid report tailored to answers', () => {
    const report = buildFallbackPathAssessmentReport({
      firstName: 'Jordan',
      email: 'jordan@example.com',
      stage: 'Career switcher',
      primaryGoal: 'Move from software into space systems integration roles.',
      experience: '8 years backend engineering, side projects in radio.',
      network: 'None',
      obstacle: 'Do not know which credentials matter versus projects.',
    });

    const parsed = PathAssessmentReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
    expect(report.headline).toContain('Jordan');
    expect(report.key_gaps.length).toBeGreaterThanOrEqual(2);
    expect(report.next_actions).toHaveLength(3);
    expect(report.upsell_bridge_live.toLowerCase()).toContain('live');
  });
});
