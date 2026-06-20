import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd } from '@/lib/seo/json-ld';
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
  bio: 'Inspiration4 astronaut.',
  imageUrl: '/chris_sembroski.jpeg',
  introVideoUrl: 'https://example.com/intro.mp4',
  availability: 'Book Session',
  liveSessionPriceCents: 25000,
  stripeOnboardingCompleted: false,
};

describe('buildPersonJsonLd', () => {
  it('builds Person schema with production profile URL', () => {
    const jsonLd = buildPersonJsonLd(sampleExpert);
    expect(jsonLd['@type']).toBe('Person');
    expect(jsonLd.name).toBe('Chris Sembroski');
    expect(jsonLd.url).toBe('https://astro-link.space/experts/chris-sembroski');
    expect(jsonLd.worksFor).toMatchObject({ name: 'Inspiration4' });
  });

  it('includes VideoObject when intro video exists', () => {
    const jsonLd = buildPersonJsonLd(sampleExpert);
    expect(jsonLd.subjectOf).toMatchObject({
      '@type': 'VideoObject',
      contentUrl: 'https://example.com/intro.mp4',
    });
  });
});