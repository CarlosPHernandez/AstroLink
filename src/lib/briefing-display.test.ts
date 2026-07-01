import { describe, expect, it } from 'vitest';
import {
  formatMenteeBriefAsPlainText,
  isLegacySessionBriefing,
  isPreCallBrief,
  isSessionBriefing,
  isSessionBriefingBundle,
  needsBriefingUpgrade,
  resolveExpertBrief,
  resolveMenteeBrief,
  resolveSessionObjectives,
} from '@/lib/briefing-display';
import type {
  MentorBriefingOutput,
  PreCallBriefOutput,
  SessionBriefingBundle,
} from '@/lib/types';

const legacyBriefing: MentorBriefingOutput = {
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

const sessionBundle: SessionBriefingBundle = {
  version: 2,
  mentee: {
    personal_intro: 'Based on your goals, you are ready to explore propulsion trade studies.',
    session_objectives: ['Review your propulsion trade study'],
    recommended_agenda: {
      minutes_0_5: 'You will frame constraints.',
      minutes_5_20: 'You will compare options.',
      minutes_20_28: 'You will review resources.',
      minutes_28_30: 'You will capture next steps.',
    },
    your_context: 'You are evaluating electric propulsion for a smallsat program.',
    questions_to_ask: ['What surprised you most in your last trade study?'],
    suggested_resources: ['NASA SBIR archives'],
  },
  mentor: {
    session_objectives: ['Review propulsion trade study'],
    recommended_agenda: {
      minutes_0_5: 'Frame constraints',
      minutes_5_20: 'Compare options',
      minutes_20_28: 'Review resources',
      minutes_28_30: 'Capture next steps',
    },
    mentee_context_summary: 'The mentee is evaluating electric propulsion.',
    facilitation_notes: ['Confirm their mass budget early.'],
    suggested_resources: ['NASA SBIR archives'],
  },
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
  it('detects v2 session bundles', () => {
    expect(isSessionBriefingBundle(sessionBundle)).toBe(true);
    expect(isSessionBriefingBundle(legacyBriefing)).toBe(false);
    expect(isSessionBriefingBundle(null)).toBe(false);
  });

  it('detects legacy session briefings', () => {
    expect(isLegacySessionBriefing(legacyBriefing)).toBe(true);
    expect(isLegacySessionBriefing(sessionBundle)).toBe(false);
    expect(isLegacySessionBriefing(preCallBrief)).toBe(false);
  });

  it('detects any live session briefing', () => {
    expect(isSessionBriefing(sessionBundle)).toBe(true);
    expect(isSessionBriefing(legacyBriefing)).toBe(true);
    expect(isSessionBriefing(preCallBrief)).toBe(false);
  });

  it('detects pre-call briefs', () => {
    expect(isPreCallBrief(preCallBrief)).toBe(true);
    expect(isPreCallBrief(sessionBundle)).toBe(false);
    expect(isPreCallBrief(null)).toBe(false);
  });
});

describe('briefing-display resolvers', () => {
  it('resolves mentee and expert slices from v2', () => {
    expect(resolveMenteeBrief(sessionBundle)?.personal_intro).toContain('Based on your');
    expect(resolveExpertBrief(sessionBundle)?.mentee_context_summary).toContain('mentee');
  });

  it('resolves legacy expert brief only', () => {
    expect(resolveMenteeBrief(legacyBriefing)).toBeNull();
    expect(resolveExpertBrief(legacyBriefing)?.mentee_context_summary).toBe(
      'Buyer is evaluating electric propulsion.',
    );
  });

  it('flags legacy briefings for upgrade', () => {
    expect(needsBriefingUpgrade(legacyBriefing)).toBe(true);
    expect(needsBriefingUpgrade(sessionBundle)).toBe(false);
  });

  it('resolves role-specific objectives', () => {
    expect(resolveSessionObjectives(sessionBundle, 'mentee')).toEqual([
      'Review your propulsion trade study',
    ]);
    expect(resolveSessionObjectives(sessionBundle, 'mentor')).toEqual([
      'Review propulsion trade study',
    ]);
    expect(resolveSessionObjectives(legacyBriefing, 'mentor')).toEqual([
      'Review propulsion trade study',
    ]);
  });

  it('formats mentee brief as plain text', () => {
    const text = formatMenteeBriefAsPlainText(sessionBundle);
    expect(text).toContain(sessionBundle.mentee.personal_intro);
    expect(text).toContain('Review your propulsion trade study');
    expect(text).toContain('What surprised you most in your last trade study?');
  });
});