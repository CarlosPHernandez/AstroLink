import 'server-only';

import { getProductionAppUrl } from '@/lib/app-url';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const CHRIS_CAMPAIGN_OG_IMAGE_PATH = '/og/talk-with-chris.png';

export type OgImageEntry = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function absoluteOgImageUrl(path: string): string {
  const base = getProductionAppUrl();
  if (path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function ogImageEntry(path: string, alt: string): OgImageEntry {
  return {
    url: absoluteOgImageUrl(path),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}

export type TwitterLargeImageMeta = {
  card: 'summary_large_image';
  images: string[];
};

export function twitterLargeImage(path: string): TwitterLargeImageMeta {
  return {
    card: 'summary_large_image',
    images: [absoluteOgImageUrl(path)],
  };
}