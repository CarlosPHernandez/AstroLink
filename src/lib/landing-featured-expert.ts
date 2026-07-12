import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

export const LANDING_FEATURED_EXPERT_SLUG = 'eiman';
export const LANDING_HERO_EXPERT_SLUG = 'chris-sembroski';

const EIMAN_PORTRAIT = '/eiman.webp';
const CHRIS_PORTRAIT = '/chris_sembroski.webp';

function isEimanExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return slug === LANDING_FEATURED_EXPERT_SLUG || slug.includes('eiman') || name.includes('eiman');
}

function isChrisExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return (
    slug === LANDING_HERO_EXPERT_SLUG ||
    slug.includes('chris-sembroski') ||
    name.includes('chris sembroski')
  );
}

export function findLandingHeroExpert(experts: ListedExpert[]): ListedExpert | null {
  return (
    experts.find((expert) => expert.slug === LANDING_HERO_EXPERT_SLUG) ??
    experts.find((expert) => isChrisExpert(expert)) ??
    null
  );
}

export function findLandingFeaturedExpert(experts: ListedExpert[]): ListedExpert | null {
  return (
    experts.find((expert) => expert.slug === LANDING_FEATURED_EXPERT_SLUG) ??
    experts.find((expert) => isEimanExpert(expert)) ??
    null
  );
}

export function orderLandingExperts(experts: ListedExpert[]): ListedExpert[] {
  const featured = findLandingFeaturedExpert(experts);
  if (!featured) return experts;
  return [featured, ...experts.filter((expert) => expert.id !== featured.id)];
}

export function landingHeroPortrait(experts: ListedExpert[]): {
  src: string;
  alt: string;
  href: string;
} {
  const heroExpert = findLandingHeroExpert(experts);
  const href = heroExpert
    ? `/experts/${heroExpert.slug}`
    : `/experts/${LANDING_HERO_EXPERT_SLUG}`;

  if (heroExpert && isChrisExpert(heroExpert)) {
    return { src: CHRIS_PORTRAIT, alt: heroExpert.name, href };
  }

  if (heroExpert) {
    return {
      src: toOptimizedImageUrl(heroExpert.imageUrl),
      alt: heroExpert.name,
      href,
    };
  }

  return {
    src: CHRIS_PORTRAIT,
    alt: 'Chris Sembroski, verified aerospace expert',
    href: `/experts/${LANDING_HERO_EXPERT_SLUG}`,
  };
}

export function landingFeaturedPortrait(expert: ListedExpert | null): { src: string; alt: string } {
  if (expert && isEimanExpert(expert)) {
    return { src: EIMAN_PORTRAIT, alt: expert.name };
  }

  if (expert) {
    return { src: toOptimizedImageUrl(expert.imageUrl), alt: expert.name };
  }

  return { src: EIMAN_PORTRAIT, alt: 'Eiman, verified aerospace expert' };
}