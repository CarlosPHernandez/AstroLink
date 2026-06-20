import { describe, expect, it } from 'vitest';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import { XPRIZE_SITE_MENTION } from '@/lib/seo/copy';
import type { ListedExpert } from '@/lib/mentor-directory';

const sampleExpert: ListedExpert = {
  id: '1',
  slug: 'chris-sembroski',
  name: 'Chris Sembroski',
  role: 'Astronaut',
  employer: 'Inspiration4',
  rate: 250,
  category: 'systems',
  expertise: ['Human spaceflight'],
  bio: 'Inspiration4 astronaut with mission operations experience.',
  imageUrl: '/chris_sembroski.jpeg',
  introVideoUrl: 'https://example.com/intro.mp4',
  availability: 'Book Session',
  liveSessionPriceCents: 25000,
  stripeOnboardingCompleted: false,
};

describe('buildPageMetadata', () => {
  it('sets production canonical on expert profile', () => {
    const metadata = buildPageMetadata({ pageType: 'expert-profile', expert: sampleExpert });
    expect(metadata.alternates?.canonical).toBe(
      'https://astro-link.space/experts/chris-sembroski',
    );
    expect(metadata.description).not.toContain('XPRIZE');
  });

  it('points join pages at the expert profile canonical', () => {
    const metadata = buildPageMetadata({ pageType: 'join-expert', expert: sampleExpert });
    expect(metadata.alternates?.canonical).toBe(
      'https://astro-link.space/experts/chris-sembroski',
    );
  });

  it('includes XPRIZE mention on early-access only', () => {
    const metadata = buildPageMetadata({ pageType: 'early-access' });
    expect(metadata.description).toContain(XPRIZE_SITE_MENTION);
  });

  it('canonicalizes experts index', () => {
    const metadata = buildPageMetadata({ pageType: 'experts-index' });
    expect(metadata.alternates?.canonical).toBe('https://astro-link.space/experts');
  });
});