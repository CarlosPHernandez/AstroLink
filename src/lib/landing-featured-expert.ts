import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

export const LANDING_FEATURED_EXPERT_SLUG = 'eiman';

const EIMAN_PORTRAIT = '/eiman.webp';

function isEimanExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return slug === LANDING_FEATURED_EXPERT_SLUG || slug.includes('eiman') || name.includes('eiman');
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

export function landingFeaturedPortrait(expert: ListedExpert | null): { src: string; alt: string } {
  if (expert && isEimanExpert(expert)) {
    return { src: EIMAN_PORTRAIT, alt: expert.name };
  }

  if (expert) {
    return { src: toOptimizedImageUrl(expert.imageUrl), alt: expert.name };
  }

  return { src: EIMAN_PORTRAIT, alt: 'Eiman, verified aerospace expert' };
}