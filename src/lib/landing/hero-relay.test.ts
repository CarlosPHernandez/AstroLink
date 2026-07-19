import { describe, expect, it } from 'vitest';
import {
  buildFallbackRelayMessages,
  buildRelayMessagesFromTeaser,
  normalizeLandingGoal,
  LANDING_GOAL_MAX_CHARS,
} from '@/lib/landing/hero-relay';
import { isLandingSuggestedPathGoal, LANDING_PATH_CHIPS } from '@/lib/landing/path-chips';
import type { LandingRelayExpert } from '@/lib/landing/featured-expert';

const expert: LandingRelayExpert = {
  slug: 'chris-sembroski',
  name: 'Chris Sembroski',
  firstName: 'Chris',
  role: 'Astronaut',
  portraitSrc: '/chris_sembroski.webp',
  portraitAlt: 'Chris',
  profileHref: '/experts/chris-sembroski',
};

describe('hero-relay', () => {
  it('normalizes and truncates goals', () => {
    expect(normalizeLandingGoal('  hello\nworld  ')).toBe('hello world');
    expect(normalizeLandingGoal('x'.repeat(500)).length).toBe(LANDING_GOAL_MAX_CHARS);
  });

  it('builds a single expert teaser bubble (CTA is the hero button)', () => {
    const fallback = buildFallbackRelayMessages('I want to work in space', expert);
    expect(fallback).toHaveLength(2);
    expect(fallback[0]).toEqual({ role: 'user', text: 'I want to work in space' });
    expect(fallback[1].role).toBe('expert');
    expect(fallback[1].text.length).toBeLessThan(160);
    expect(fallback[1].text).not.toMatch(/Continue this conversation|Create a free account/i);

    const custom = buildRelayMessagesFromTeaser('goal', 'Unique teaser about your goal.');
    expect(custom).toHaveLength(2);
    expect(custom[1].text).toBe('Unique teaser about your goal.');
  });

  it('detects path-chip goals as suggested', () => {
    for (const chip of LANDING_PATH_CHIPS) {
      expect(isLandingSuggestedPathGoal(chip.goal)).toBe(true);
    }
    expect(isLandingSuggestedPathGoal('How do ion thrusters work in practice?')).toBe(false);
  });
});
