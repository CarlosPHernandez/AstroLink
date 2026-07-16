import { describe, expect, it, vi } from 'vitest';
import {
  buildTalkWithChrisMetadata,
  TALK_WITH_CHRIS_PAGE_DESCRIPTION,
  TALK_WITH_CHRIS_PAGE_TITLE,
} from '@/lib/chris-campaign/chris-campaign-social-meta';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/seo/og-images';

vi.mock('@/lib/app-url', () => ({
  getProductionAppUrl: () => 'https://astro-link.space',
}));

describe('buildTalkWithChrisMetadata', () => {
  it('sets Chris campaign OG image with production absolute URL', () => {
    const metadata = buildTalkWithChrisMetadata();

    expect(metadata.title).toBe(TALK_WITH_CHRIS_PAGE_TITLE);
    expect(metadata.description).toBe(TALK_WITH_CHRIS_PAGE_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe('https://astro-link.space/talk-with-chris');
    expect(metadata.openGraph?.url).toBe('https://astro-link.space/talk-with-chris');
    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://astro-link.space/og/talk-with-chris.png',
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: 'Private session with Chris Sembroski on AstroLink',
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://astro-link.space/og/talk-with-chris.png'],
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});