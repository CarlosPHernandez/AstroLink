import { describe, expect, it } from 'vitest';
import {
  PATH_ASSESSMENT_NETWORKS,
  PATH_ASSESSMENT_STAGES,
  PathAssessmentAnswersSchema,
  PathAssessmentReportSchema,
  PathAssessmentSubmitBodySchema,
} from '@/lib/path-assessment/schema';

const validAnswers = {
  firstName: 'Alex',
  email: 'alex@example.com',
  stage: 'Student' as const,
  primaryGoal: 'Get a summer internship in flight software.',
  experience: 'Junior AE student, CubeSat FSW lead for two years.',
  network: '1–2 people' as const,
  obstacle: 'Unsure how to present projects to hiring managers.',
};

describe('PathAssessmentAnswersSchema', () => {
  it('accepts a full valid intake', () => {
    const parsed = PathAssessmentAnswersSchema.safeParse(validAnswers);
    expect(parsed.success).toBe(true);
  });

  it('rejects short goal / experience / obstacle', () => {
    const parsed = PathAssessmentAnswersSchema.safeParse({
      ...validAnswers,
      primaryGoal: 'short',
      experience: 'short',
      obstacle: 'short',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid stage and network', () => {
    const parsed = PathAssessmentAnswersSchema.safeParse({
      ...validAnswers,
      stage: 'Astronaut',
      network: 'Huge',
    });
    expect(parsed.success).toBe(false);
  });

  it('exports expected stage and network options', () => {
    expect(PATH_ASSESSMENT_STAGES).toContain('Career switcher');
    expect(PATH_ASSESSMENT_NETWORKS).toContain('Strong network');
  });
});

describe('PathAssessmentSubmitBodySchema', () => {
  it('allows optional honeypot website', () => {
    const parsed = PathAssessmentSubmitBodySchema.safeParse({
      ...validAnswers,
      website: 'http://spam.example',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('PathAssessmentReportSchema', () => {
  it('accepts a full report', () => {
    const report = {
      headline: 'Clear direction',
      standing_summary: 'You are early career with solid project signals.',
      key_gaps: [
        { title: 'Proof', detail: 'Need one mission-relevant artifact.' },
        { title: 'Network', detail: 'Expand operator intros.' },
      ],
      focus_areas: ['90-day plan', 'Proof artifact'],
      expert_conversation_type: 'Live path review with flight software operator.',
      next_actions: [
        { action: 'Draft standing note', why: 'Shared map for expert.' },
        { action: 'List three questions', why: 'Protect live time.' },
        { action: 'Book live review', why: 'Attach assessment.' },
      ],
      upsell_bridge_live: 'Book a live expert review with this report.',
      upsell_bridge_written: 'Written review coming later.',
    };
    expect(PathAssessmentReportSchema.safeParse(report).success).toBe(true);
  });
});
