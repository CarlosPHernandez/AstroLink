import 'server-only';

import type { Metadata } from 'next';
import { getAppBaseUrl } from '@/lib/app-url';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { DEFAULT_MENTOR_IMAGE, toOptimizedImageUrl } from '@/lib/public-images';
import { WAITLIST_FEATURED_EXPERT_SLUG } from '@/lib/waitlist/waitlist-roster-order';

export const EARLY_ACCESS_PAGE_TITLE = 'Early Access | AstroLink';
export const EARLY_ACCESS_PAGE_DESCRIPTION =
  'Join the waitlist for AstroLink — live 1:1 video sessions with verified aerospace experts, including Inspiration4 astronaut Chris Sembroski.';

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
  const pageUrl = `${baseUrl}/early-access`;
  const chris = await getMentorBySlug(WAITLIST_FEATURED_EXPERT_SLUG);
  const thumbnailUrl = absolutePublicAssetUrl(chris?.imageUrl ?? DEFAULT_MENTOR_IMAGE, baseUrl);
  const streamUrl = chris?.introVideoUrl?.trim() ?? null;
  const playerUrl = `${baseUrl}/early-access/player`;

  const openGraph = {
    title: EARLY_ACCESS_PAGE_TITLE,
    description: EARLY_ACCESS_PAGE_DESCRIPTION,
    url: pageUrl,
    siteName: 'AstroLink',
    type: 'website' as const,
    images: [
      {
        url: thumbnailUrl,
        width: EARLY_ACCESS_TWITTER_PLAYER_WIDTH,
        height: EARLY_ACCESS_TWITTER_PLAYER_HEIGHT,
        alt: chris ? `${chris.name} introduction video` : 'AstroLink early access',
      },
    ],
  };

  if (!streamUrl) {
    return {
      metadataBase: new URL(baseUrl),
      title: EARLY_ACCESS_PAGE_TITLE,
      description: EARLY_ACCESS_PAGE_DESCRIPTION,
      alternates: { canonical: pageUrl },
      openGraph,
      twitter: {
        card: 'summary_large_image',
        title: EARLY_ACCESS_PAGE_TITLE,
        description: EARLY_ACCESS_PAGE_DESCRIPTION,
        images: [thumbnailUrl],
      },
    };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: EARLY_ACCESS_PAGE_TITLE,
    description: EARLY_ACCESS_PAGE_DESCRIPTION,
    alternates: { canonical: pageUrl },
    openGraph,
    twitter: {
      card: 'player',
      title: EARLY_ACCESS_PAGE_TITLE,
      description: EARLY_ACCESS_PAGE_DESCRIPTION,
      images: [thumbnailUrl],
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