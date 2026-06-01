import { describe, expect, it } from 'vitest';
import { isPreCallBrief, isSessionBriefing } from '@/lib/briefing-display';
import type { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

const sessionBriefing: MentorBriefingOutput = {
  session_objectives: ['Review propulsion trade study'],
  recommended_agenda: {
    minutes_0_5: 'Intro',
    minutes_5_20: 'Deep dive',
    minutes_20_28: 'Resources',
    minutes_28_30: 'Wrap',
  },
  mentee_context_summary: 'Buyer is evaluating electric propulsion.',
  suggested_resources: ['NASA SBIR archives'],
};

const preCallBrief: PreCallBriefOutput = {
  buyer_context_summary: 'Founder preparing investor diligence.',
  buyer_strengths: ['Systems engineering background'],
  focus_areas: [
    {
      topic: 'Regulatory path',
      why_for_expert: 'Expert flew commercial missions',
      severity: 'high',
      suggested_angle: 'Ask about FAA licensing timeline',
    },
    {
      topic: 'Supply chain',
      why_for_expert: 'Hardware integration experience',
      severity: 'medium',
      suggested_angle: 'Vendor qualification',
    },
    {
      topic: 'Ops cadence',
      why_for_expert: 'Mission ops background',
      severity: 'medium',
      suggested_angle: 'Crew readiness',
    },
  ],
  proposed_questions: ['What surprised you most post-flight?'],
  session_readiness_score: 0.82,
  one_line_summary: 'Strong technical buyer; needs regulatory framing.',
};

describe('briefing-display type guards', () => {
  it('detects session briefings', () => {
    expect(isSessionBriefing(sessionBriefing)).toBe(true);
    expect(isSessionBriefing(preCallBrief)).toBe(false);
    expect(isSessionBriefing(null)).toBe(false);
  });

  it('detects pre-call briefs', () => {
    expect(isPreCallBrief(preCallBrief)).toBe(true);
    expect(isPreCallBrief(sessionBriefing)).toBe(false);
    expect(isPreCallBrief(null)).toBe(false);
  });
});
