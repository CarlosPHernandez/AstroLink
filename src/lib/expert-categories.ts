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