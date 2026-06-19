import type { ListedExpert } from '@/lib/mentor-directory';

export const WAITLIST_FEATURED_EXPERT_SLUG = 'chris-sembroski';

export function orderWaitlistRoster(experts: ListedExpert[]): ListedExpert[] {
  const featured = experts.find((expert) => expert.slug === WAITLIST_FEATURED_EXPERT_SLUG);
  const rest = experts
    .filter((expert) => expert.slug !== WAITLIST_FEATURED_EXPERT_SLUG)
    .sort((a, b) => a.name.localeCompare(b.name));

  return featured ? [featured, ...rest] : rest;
}