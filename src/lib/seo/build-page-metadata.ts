import 'server-only';

import type { Metadata } from 'next';
import { getProductionAppUrl } from '@/lib/app-url';
import { DEFAULT_MENTOR_IMAGE, toOptimizedImageUrl } from '@/lib/public-images';
import {
  EARLY_ACCESS_DESCRIPTION,
  EARLY_ACCESS_TITLE,
  EXPERTS_INDEX_DESCRIPTION,
  EXPERTS_INDEX_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  SITE_NAME,
  truncateMetaDescription,
  withXprizeMention,
} from '@/lib/seo/copy';
import type { BuildPageMetadataInput } from '@/lib/seo/types';

function productionUrl(path: string): string {
  const base = getProductionAppUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

function absoluteAssetUrl(path: string): string {
  const base = getProductionAppUrl();
  if (path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${toOptimizedImageUrl(normalized)}`;
}

function baseMetadata(canonicalPath: string): Pick<Metadata, 'metadataBase' | 'alternates'> {
  return {
    metadataBase: new URL(getProductionAppUrl()),
    alternates: {
      canonical: productionUrl(canonicalPath),
    },
  };
}

function expertDescription(expert: { name: string; role: string; bio: string }): string {
  const fromBio = expert.bio.trim();
  if (fromBio) {
    return truncateMetaDescription(fromBio);
  }
  return truncateMetaDescription(
    `${expert.name} — ${expert.role}. Verified aerospace expert on AstroLink.`,
  );
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  switch (input.pageType) {
    case 'privacy':
      return {
        ...baseMetadata('/privacy'),
        title: PRIVACY_TITLE,
        description: PRIVACY_DESCRIPTION,
        robots: { index: true, follow: true },
        openGraph: {
          title: PRIVACY_TITLE,
          description: PRIVACY_DESCRIPTION,
          url: productionUrl('/privacy'),
          siteName: SITE_NAME,
        },
      };

    case 'experts-index':
      return {
        ...baseMetadata('/experts'),
        title: EXPERTS_INDEX_TITLE,
        description: truncateMetaDescription(EXPERTS_INDEX_DESCRIPTION),
        openGraph: {
          title: 'Verified Experts | AstroLink',
          description: EXPERTS_INDEX_DESCRIPTION,
          url: productionUrl('/experts'),
          siteName: SITE_NAME,
        },
      };

    case 'early-access':
      return {
        ...baseMetadata('/early-access'),
        title: EARLY_ACCESS_TITLE,
        description: withXprizeMention(EARLY_ACCESS_DESCRIPTION),
        openGraph: {
          title: EARLY_ACCESS_TITLE,
          description: withXprizeMention(EARLY_ACCESS_DESCRIPTION),
          url: productionUrl('/early-access'),
          siteName: SITE_NAME,
        },
      };

    case 'expert-profile': {
      const { expert } = input;
      const canonicalPath = `/experts/${expert.slug}`;
      const title = `${expert.name} · AstroLink`;
      const description = expertDescription(expert);
      const imageUrl = absoluteAssetUrl(expert.imageUrl ?? DEFAULT_MENTOR_IMAGE);
      return {
        ...baseMetadata(canonicalPath),
        title,
        description,
        openGraph: {
          title: `${expert.name} — Verified Aerospace Expert | AstroLink`,
          description,
          url: productionUrl(canonicalPath),
          siteName: SITE_NAME,
          images: [{ url: imageUrl, alt: `${expert.name} — AstroLink expert` }],
        },
      };
    }

    case 'join-expert': {
      const { expert } = input;
      const joinPath = `/join/${expert.slug}`;
      const expertCanonical = `/experts/${expert.slug}`;
      const fallback = `Join the waitlist for live 1:1 video sessions with ${expert.name} on AstroLink.`;
      const description = truncateMetaDescription(expert.bio.trim() || fallback);
      const title = `Early access · ${expert.name}`;
      const imageUrl = absoluteAssetUrl(expert.imageUrl ?? DEFAULT_MENTOR_IMAGE);
      return {
        metadataBase: new URL(getProductionAppUrl()),
        alternates: {
          canonical: productionUrl(expertCanonical),
        },
        title,
        description,
        openGraph: {
          title: `Early access · ${expert.name} · AstroLink`,
          description,
          url: productionUrl(joinPath),
          siteName: SITE_NAME,
          images: [{ url: imageUrl, alt: `${expert.name} — AstroLink early access` }],
        },
      };
    }

    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}