import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  absolutePublicAssetUrl,
  buildEarlyAccessMetadata,
  EARLY_ACCESS_PAGE_TITLE,
  EARLY_ACCESS_TWITTER_PLAYER_HEIGHT,
  EARLY_ACCESS_TWITTER_PLAYER_WIDTH,
} from '@/lib/waitlist/early-access-social-meta';

vi.mock('@/lib/app-url', () => ({
  getAppBaseUrl: () => 'https://astro-link.space',
  getProductionAppUrl: () => 'https://astro-link.space',
}));

vi.mock('@/lib/mentor-directory', () => ({
  getMentorBySlug: vi.fn(),
}));

import { getMentorBySlug } from '@/lib/mentor-directory';

const mockedGetMentor = vi.mocked(getMentorBySlug);

describe('absolutePublicAssetUrl', () => {
  it('prefixes local public paths with the app origin', () => {
    expect(absolutePublicAssetUrl('/chris_sembroski.jpeg', 'https://astro-link.space')).toBe(
      'https://astro-link.space/chris_sembroski.webp',
    );
  });

  it('returns absolute URLs unchanged', () => {
    expect(
      absolutePublicAssetUrl(
        'https://cdn.example.com/poster.jpg',
        'https://astro-link.space',
      ),
    ).toBe('https://cdn.example.com/poster.jpg');
  });
});

describe('buildEarlyAccessMetadata', () => {
  beforeEach(() => {
    mockedGetMentor.mockReset();
  });

  it('uses a Twitter Player card when Chris has an intro video', async () => {
    mockedGetMentor.mockResolvedValue({
      id: 'a',
      slug: 'chris-sembroski',
      name: 'Chris Sembroski',
      role: 'Astronaut',
      employer: 'Inspiration4',
      rate: 250,
      category: 'systems',
      expertise: [],
      bio: 'Bio',
      imageUrl: '/chris_sembroski.jpeg',
      introVideoUrl:
        'https://vwoizjesyyygmokfqpyy.supabase.co/storage/v1/object/public/expert-intro-videos/chris-sembroski/chris-sembroski-bio.mp4',
      availability: 'Book Session',
      liveSessionPriceCents: 25000,
      stripeOnboardingCompleted: false,
    });

    const metadata = await buildEarlyAccessMetadata();

    expect(metadata.title).toBe(EARLY_ACCESS_PAGE_TITLE);
    expect(metadata.description).toContain('Build with Gemini XPRIZE');
    expect(metadata.alternates?.canonical).toBe('https://astro-link.space/early-access');
    expect(metadata.openGraph?.url).toBe('https://astro-link.space/early-access');
    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://astro-link.space/og/talk-with-chris.png',
        width: 1200,
        height: 630,
        alt: 'Early access to live sessions with Chris Sembroski on AstroLink',
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: 'player',
      images: ['https://astro-link.space/og/talk-with-chris.png'],
      players: {
        playerUrl: 'https://astro-link.space/early-access/player',
        streamUrl:
          'https://vwoizjesyyygmokfqpyy.supabase.co/storage/v1/object/public/expert-intro-videos/chris-sembroski/chris-sembroski-bio.mp4',
        width: EARLY_ACCESS_TWITTER_PLAYER_WIDTH,
        height: EARLY_ACCESS_TWITTER_PLAYER_HEIGHT,
      },
    });
    expect(metadata.other).toMatchObject({
      'twitter:player:stream:content_type': 'video/mp4',
    });
  });

  it('falls back to summary_large_image when no intro video is configured', async () => {
    mockedGetMentor.mockResolvedValue(null);

    const metadata = await buildEarlyAccessMetadata();

    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://astro-link.space/og/talk-with-chris.png',
        width: 1200,
        height: 630,
        alt: 'AstroLink early access',
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://astro-link.space/og/talk-with-chris.png'],
    });
  });
});
