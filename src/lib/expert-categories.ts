import type { ExpertCategory } from '@/lib/mentor-directory';

export const EXPERT_CATEGORIES = ['all', 'systems', 'propulsion', 'spacecraft', 'policy'] as const;

export type ExpertCategoryFilterValue = (typeof EXPERT_CATEGORIES)[number];

export function filterExpertsByCategory<T extends { category: ExpertCategory }>(
  experts: T[],
  category: string,
): T[] {
  if (category === 'all') {
    return experts;
  }
  return experts.filter((expert) => expert.category === category);
}

/** True when the selected expert would disappear from the picker after a category change. */
export function shouldClearExpertOnCategoryChange<T extends { slug: string; category: ExpertCategory }>(
  experts: T[],
  selectedSlug: string | null,
  category: string,
): boolean {
  if (!selectedSlug) {
    return false;
  }
  const visible = filterExpertsByCategory(experts, category);
  return !visible.some((expert) => expert.slug === selectedSlug);
}