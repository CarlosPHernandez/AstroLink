import { describe, expect, it } from 'vitest';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  LANDING_FEATURED_EXPERT_SLUG,
  findLandingFeaturedExpert,
  landingFeaturedPortrait,
  landingHeroPortrait,
  orderLandingExperts,
  pickLandingRelayExpert,
} from '@/lib/landing-featured-expert';

const EIMAN_SUPABASE_IMAGE =
  'https://vwoizjesyyygmokfqpyy.supabase.co/storage/v1/object/public/expert-intro-videos/Eiman-Jahangir/Eiman%20Jahangir%20Headshot.jpg';

function expert(
  slug: string,
  name: string,
  imageUrl = '/other.webp',
): ListedExpert {
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
    imageUrl,
    introVideoUrl: null,
    availability: 'Book Session',
    liveSessionPriceCents: 25000,
    stripeOnboardingCompleted: false,
  };
}

describe('landing-featured-expert', () => {
  it('prioritizes Eiman in roster order by Supabase slug', () => {
    const ordered = orderLandingExperts([
      expert('chris-sembroski', 'Chris Sembroski'),
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
    ]);
    expect(ordered[0]?.slug).toBe(LANDING_FEATURED_EXPERT_SLUG);
  });

  it('uses roster image_url for Eiman (Supabase storage)', () => {
    const portrait = landingFeaturedPortrait(
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
    );
    expect(portrait.src).toBe(EIMAN_SUPABASE_IMAGE);
    expect(portrait.alt).toBe('Eiman Jahangir');
  });

  it('finds Eiman by slug from roster', () => {
    const found = findLandingFeaturedExpert([expert('chris-sembroski', 'Chris')]);
    expect(found).toBeNull();

    const eiman = findLandingFeaturedExpert([
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
    ]);
    expect(eiman?.slug).toBe(LANDING_FEATURED_EXPERT_SLUG);
  });

  it('uses Chris for the hero portrait', () => {
    const portrait = landingHeroPortrait([
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
      expert('chris-sembroski', 'Chris Sembroski'),
    ]);
    expect(portrait.src).toBe('/chris_sembroski.webp');
    expect(portrait.alt).toBe('Chris Sembroski');
    expect(portrait.href).toBe('/experts/chris-sembroski');
  });

  it('routes propulsion goals to Eiman from roster media', () => {
    const roster = [
      expert('chris-sembroski', 'Chris Sembroski'),
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
    ];
    const matched = pickLandingRelayExpert('How do ion propulsion engines scale?', roster);
    expect(matched.slug).toBe(LANDING_FEATURED_EXPERT_SLUG);
    expect(matched.portraitSrc).toBe(EIMAN_SUPABASE_IMAGE);
    expect(matched.profileHref).toBe(`/experts/${LANDING_FEATURED_EXPERT_SLUG}`);
  });

  it('uses Eiman Jahangir fallback for propulsion when roster lacks her', () => {
    const matched = pickLandingRelayExpert('How do rocket engines work?', [
      expert('chris-sembroski', 'Chris Sembroski'),
    ]);
    expect(matched.slug).toBe(LANDING_FEATURED_EXPERT_SLUG);
    expect(matched.name).toBe('Eiman Jahangir');
    expect(matched.portraitSrc).toBe('/eiman.webp');
  });

  it('routes career goals to Chris', () => {
    const roster = [
      expert('chris-sembroski', 'Chris Sembroski'),
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
    ];
    const matched = pickLandingRelayExpert('How do I become an astronaut?', roster);
    expect(matched.slug).toBe('chris-sembroski');
    expect(matched.portraitSrc).toBe('/chris_sembroski.webp');
  });
});
