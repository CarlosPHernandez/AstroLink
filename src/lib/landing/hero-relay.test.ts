import { describe, expect, it } from 'vitest';
import {
  buildFallbackRelayMessages,
  buildRelayMessagesFromTeaser,
  normalizeLandingGoal,
  LANDING_GOAL_MAX_CHARS,
} from '@/lib/landing/hero-relay';
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

  it('builds fallback and teaser message shapes', () => {
    const fallback = buildFallbackRelayMessages('I want to work in space', expert);
    expect(fallback).toHaveLength(3);
    expect(fallback[0]).toEqual({ role: 'user', text: 'I want to work in space' });
    expect(fallback[1].role).toBe('expert');

    const custom = buildRelayMessagesFromTeaser(
      'goal',
      'Unique teaser about your goal.',
      'View profile next.',
    );
    expect(custom[1].text).toBe('Unique teaser about your goal.');
  });
});
