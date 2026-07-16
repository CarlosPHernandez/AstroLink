import 'server-only';

import type { Metadata } from 'next';
import { getAppBaseUrl, getProductionAppUrl } from '@/lib/app-url';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';
import {
  EARLY_ACCESS_DESCRIPTION,
  EARLY_ACCESS_TITLE,
  withXprizeMention,
} from '@/lib/seo/copy';
import { defaultSiteOgImage } from '@/lib/seo/og-images';
import { WAITLIST_FEATURED_EXPERT_SLUG } from '@/lib/waitlist/waitlist-roster-order';

export const EARLY_ACCESS_PAGE_TITLE = EARLY_ACCESS_TITLE;
export const EARLY_ACCESS_PAGE_DESCRIPTION = EARLY_ACCESS_DESCRIPTION;

/** Portrait player iframe — matches Chris intro hero (4:5). */
export const EARLY_ACCESS_TWITTER_PLAYER_WIDTH = 720;
export const EARLY_ACCESS_TWITTER_PLAYER_HEIGHT = 900;

export function absolutePublicAssetUrl(path: string, baseUrl: string): string {
  if (path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${toOptimizedImageUrl(normalized)}`;
}

export async function buildEarlyAccessMetadata(): Promise<Metadata> {
  const baseUrl = getAppBaseUrl();
  const canonicalUrl = `${getProductionAppUrl()}/early-access`;
  const pageDescription = withXprizeMention(EARLY_ACCESS_PAGE_DESCRIPTION);
  const chris = await getMentorBySlug(WAITLIST_FEATURED_EXPERT_SLUG);
  const streamUrl = chris?.introVideoUrl?.trim() ?? null;
  const playerUrl = `${baseUrl}/early-access/player`;

  const openGraph = {
    title: EARLY_ACCESS_PAGE_TITLE,
    description: pageDescription,
    url: canonicalUrl,
    siteName: 'AstroLink',
    type: 'website' as const,
    images: [
      defaultSiteOgImage(
        chris
          ? `Early access to live sessions with ${chris.name} on AstroLink`
          : 'AstroLink early access',
      ),
    ],
  };

  if (!streamUrl) {
    return {
      metadataBase: new URL(getProductionAppUrl()),
      title: EARLY_ACCESS_PAGE_TITLE,
      description: pageDescription,
      alternates: { canonical: canonicalUrl },
      openGraph,
      twitter: {
        card: 'summary_large_image',
        title: EARLY_ACCESS_PAGE_TITLE,
        description: pageDescription,
        images: [defaultSiteOgImage().url],
      },
    };
  }

  return {
    metadataBase: new URL(getProductionAppUrl()),
    title: EARLY_ACCESS_PAGE_TITLE,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph,
    twitter: {
      card: 'player',
      title: EARLY_ACCESS_PAGE_TITLE,
      description: pageDescription,
      images: [defaultSiteOgImage().url],
      players: {
        playerUrl,
        streamUrl,
        width: EARLY_ACCESS_TWITTER_PLAYER_WIDTH,
        height: EARLY_ACCESS_TWITTER_PLAYER_HEIGHT,
      },
    },
    other: {
      'twitter:player:stream:content_type': 'video/mp4',
    },
  };
}