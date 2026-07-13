import { describe, expect, it } from 'vitest';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  findLandingFeaturedExpert,
  landingFeaturedPortrait,
  landingHeroPortrait,
  orderLandingExperts,
  pickLandingRelayExpert,
} from '@/lib/landing-featured-expert';

function expert(slug: string, name: string): ListedExpert {
  return {
    id: slug,
    slug,
    name,
    role: 'Expert',
    employer: 'NASA',
    rate: 250,
    category: 'systems',
    expertise: ['systems'],
    bio: 'Bio',
    imageUrl: '/other.webp',
    introVideoUrl: null,
    availability: 'Book Session',
    liveSessionPriceCents: 25000,
    stripeOnboardingCompleted: false,
  };
}

describe('landing-featured-expert', () => {
  it('prioritizes Eiman in roster order', () => {
    const ordered = orderLandingExperts([
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('eiman', 'Eiman Ahmad'),
    ]);
    expect(ordered[0]?.slug).toBe('eiman');
  });

  it('uses local Eiman portrait asset', () => {
    const portrait = landingFeaturedPortrait(expert('eiman', 'Eiman Ahmad'));
    expect(portrait.src).toBe('/eiman.webp');
    expect(portrait.alt).toBe('Eiman Ahmad');
  });

  it('finds Eiman by slug', () => {
    const found = findLandingFeaturedExpert([expert('chris-sembroski', 'Chris')]);
    expect(found).toBeNull();
  });

  it('uses Chris for the hero portrait', () => {
    const portrait = landingHeroPortrait([
      expert('eiman', 'Eiman Ahmad'),
      expert('chris-sembroski', 'Chris Sembroski'),
    ]);
    expect(portrait.src).toBe('/chris_sembroski.webp');
    expect(portrait.alt).toBe('Chris Sembroski');
    expect(portrait.href).toBe('/experts/chris-sembroski');
  });

  it('routes propulsion goals to Eiman', () => {
    const roster = [
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('eiman', 'Eiman Ahmad'),
    ];
    const matched = pickLandingRelayExpert('How do ion propulsion engines scale?', roster);
    expect(matched.slug).toBe('eiman');
    expect(matched.portraitSrc).toBe('/eiman.webp');
  });

  it('uses Eiman fallback for propulsion when roster lacks her', () => {
    const matched = pickLandingRelayExpert('How do rocket engines work?', [
      expert('chris-sembroski', 'Chris Sembroski'),
    ]);
    expect(matched.slug).toBe('eiman');
    expect(matched.portraitSrc).toBe('/eiman.webp');
  });

  it('routes career goals to Chris', () => {
    const roster = [
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('eiman', 'Eiman Ahmad'),
    ];
    const matched = pickLandingRelayExpert('How do I become an astronaut?', roster);
    expect(matched.slug).toBe('chris-sembroski');
    expect(matched.portraitSrc).toBe('/chris_sembroski.webp');
  });
});