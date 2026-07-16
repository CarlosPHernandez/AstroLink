import 'server-only';

import type { Metadata } from 'next';
import { getProductionAppUrl } from '@/lib/app-url';
import { CHRIS_CAMPAIGN_LANDING_PATH } from '@/lib/chris-campaign/chris-campaign-routes';
import {
  CHRIS_CAMPAIGN_OG_IMAGE_PATH,
  ogImageEntry,
  twitterLargeImage,
} from '@/lib/seo/og-images';

export const TALK_WITH_CHRIS_PAGE_TITLE =
  'Private 45-Minute Session with Astronaut Chris Sembroski';

export const TALK_WITH_CHRIS_PAGE_DESCRIPTION =
  'Guaranteed 1:1 access with Inspiration4 astronaut Chris Sembroski. No stage, no audience — direct answers to your goals in a full 45-minute private session.';

export function buildTalkWithChrisMetadata(): Metadata {
  const canonicalUrl = `${getProductionAppUrl()}${CHRIS_CAMPAIGN_LANDING_PATH}`;

  return {
    metadataBase: new URL(getProductionAppUrl()),
    title: TALK_WITH_CHRIS_PAGE_TITLE,
    description: TALK_WITH_CHRIS_PAGE_DESCRIPTION,
    robots: { index: false, follow: false },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: TALK_WITH_CHRIS_PAGE_TITLE,
      description: TALK_WITH_CHRIS_PAGE_DESCRIPTION,
      url: canonicalUrl,
      siteName: 'AstroLink',
      type: 'website',
      images: [
        ogImageEntry(
          CHRIS_CAMPAIGN_OG_IMAGE_PATH,
          'Private session with Chris Sembroski on AstroLink',
        ),
      ],
    },
    twitter: {
      ...twitterLargeImage(CHRIS_CAMPAIGN_OG_IMAGE_PATH),
      title: TALK_WITH_CHRIS_PAGE_TITLE,
      description: TALK_WITH_CHRIS_PAGE_DESCRIPTION,
    },
  };
}