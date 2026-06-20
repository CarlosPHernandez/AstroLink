import type { ListedExpert } from '@/lib/mentor-directory';
import { getProductionAppUrl } from '@/lib/app-url';

function productionUrl(path: string): string {
  const base = getProductionAppUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPersonJsonLd(expert: ListedExpert): Record<string, unknown> {
  const url = productionUrl(`/experts/${expert.slug}`);
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: expert.name,
    url,
    description: expert.bio.trim() || expert.role,
    jobTitle: expert.role,
  };

  if (expert.employer?.trim()) {
    jsonLd.worksFor = {
      '@type': 'Organization',
      name: expert.employer.trim(),
    };
  }

  if (expert.imageUrl) {
    jsonLd.image = expert.imageUrl.startsWith('https://')
      ? expert.imageUrl
      : productionUrl(expert.imageUrl);
  }

  if (expert.introVideoUrl?.trim()) {
    jsonLd.subjectOf = {
      '@type': 'VideoObject',
      name: `${expert.name} introduction`,
      contentUrl: expert.introVideoUrl.trim(),
      description: `Introduction video for ${expert.name} on AstroLink`,
    };
  }

  return jsonLd;
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AstroLink',
    url: getProductionAppUrl(),
    description:
      'Book verified aerospace experts for live 1:1 video sessions — astronauts, flight controllers, and operators.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getProductionAppUrl()}/experts?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}