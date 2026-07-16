import { describe, expect, it, vi } from 'vitest';
import {
  CHRIS_CAMPAIGN_OG_IMAGE_PATH,
  defaultSiteOgImage,
  defaultSiteTwitterImage,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '@/lib/seo/og-images';

vi.mock('@/lib/app-url', () => ({
  getProductionAppUrl: () => 'https://astro-link.space',
}));

describe('defaultSiteOgImage', () => {
  it('points at the shipped Chris campaign OG asset', () => {
    expect(defaultSiteOgImage()).toEqual({
      url: `https://astro-link.space${CHRIS_CAMPAIGN_OG_IMAGE_PATH}`,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: 'AstroLink — live 1:1 sessions with verified aerospace experts',
    });
  });
});

describe('defaultSiteTwitterImage', () => {
  it('uses summary_large_image with the default OG asset', () => {
    expect(defaultSiteTwitterImage()).toEqual({
      card: 'summary_large_image',
      images: [`https://astro-link.space${CHRIS_CAMPAIGN_OG_IMAGE_PATH}`],
    });
  });
});