import { describe, expect, it } from 'vitest';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  LANDING_FEATURED_EXPERT_SLUG,
  LANDING_HERO_ROTATION_SLUGS,
  findLandingFeaturedExpert,
  landingFeaturedPortrait,
  landingHeroPortrait,
  landingHeroPortraitStrip,
  landingHeroRotationPortraits,
  orderLandingDirectoryExperts,
  orderLandingExperts,
  pickLandingRelayExpert,
} from '@/lib/landing/featured-expert';

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

  it('builds hero rotation as Chris → Priya → Eiman from roster', () => {
    const rotation = landingHeroRotationPortraits([
      expert('other', 'Other'),
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
      expert('priya-abiram', 'Priya Abiram', '/priya.webp'),
      expert('chris-sembroski', 'Chris Sembroski'),
    ]);
    expect(rotation.map((p) => p.slug)).toEqual([...LANDING_HERO_ROTATION_SLUGS]);
    expect(rotation[0]?.src).toBe('/chris_sembroski.webp');
    expect(rotation[1]?.src).toBe('/priya.webp');
    expect(rotation[2]?.src).toBe(EIMAN_SUPABASE_IMAGE);
  });

  it('builds a hero strip with Chris first and caps length', () => {
    const strip = landingHeroPortraitStrip(
      [
        expert('other-1', 'Other One'),
        expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
        expert('chris-sembroski', 'Chris Sembroski'),
        expert('other-2', 'Other Two'),
        expert('other-3', 'Other Three'),
        expert('other-4', 'Other Four'),
      ],
      3,
    );
    expect(strip).toHaveLength(3);
    expect(strip[0]?.slug).toBe('chris-sembroski');
    expect(strip[0]?.src).toBe('/chris_sembroski.webp');
    expect(strip.map((p) => p.slug)).toEqual([
      'chris-sembroski',
      'other-1',
      LANDING_FEATURED_EXPERT_SLUG,
    ]);
  });

  it('falls back to Chris alone when roster is empty', () => {
    const strip = landingHeroPortraitStrip([]);
    expect(strip).toHaveLength(1);
    expect(strip[0]?.slug).toBe('chris-sembroski');
    expect(strip[0]?.src).toBe('/chris_sembroski.webp');
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

describe('orderLandingDirectoryExperts', () => {
  it('orders experts Eiman, Chris, Priya, Jenni, Andrew regardless of input order', () => {
    const ordered = orderLandingDirectoryExperts([
      expert('andrew-parris', 'Andrew Parris'),
      expert('priya-abiram', 'Priya Abiram'),
      expert('chris-sembroski', 'Chris Sembroski'),
      expert(LANDING_FEATURED_EXPERT_SLUG, 'Eiman Jahangir', EIMAN_SUPABASE_IMAGE),
      expert('jenni-doe', 'Jenni Doe'),
    ]);
    expect(ordered.map((e) => e.slug)).toEqual([
      LANDING_FEATURED_EXPERT_SLUG,
      'chris-sembroski',
      'priya-abiram',
      'jenni-doe',
      'andrew-parris',
    ]);
  });

  it('gracefully degrades when part of the fixed roster is missing', () => {
    const ordered = orderLandingDirectoryExperts([
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('priya-abiram', 'Priya Abiram'),
    ]);
    expect(ordered.map((e) => e.slug)).toEqual(['chris-sembroski', 'priya-abiram']);
  });

  it('excludes roster experts who are not in the fixed name list', () => {
    const ordered = orderLandingDirectoryExperts([
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('random-1', 'Random One'),
    ]);
    expect(ordered.map((e) => e.slug)).toEqual(['chris-sembroski']);
  });

  it('returns an empty array for an empty roster', () => {
    expect(orderLandingDirectoryExperts([])).toEqual([]);
  });

  it('matches names case-insensitively', () => {
    const ordered = orderLandingDirectoryExperts([expert('chris-id', 'CHRIS SEMBROSKI')]);
    expect(ordered.map((e) => e.slug)).toEqual(['chris-id']);
  });

  it('does not list the same expert twice when their name matches multiple keys', () => {
    // Name contains both "chris" and "priya" substrings — should only be placed once,
    // at the first key it matches ("chris"), not duplicated at "priya" too.
    const ordered = orderLandingDirectoryExperts([expert('chris-priyanka', 'Chris Priyanka')]);
    expect(ordered.map((e) => e.slug)).toEqual(['chris-priyanka']);
  });
});
