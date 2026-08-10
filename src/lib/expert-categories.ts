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

/** Lightweight name/role/expertise substring match for the hero search bar (?q=). */
export function filterExpertsByQuery<
  T extends { name: string; role: string; employer: string; expertise: string[] },
>(experts: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return experts;
  }
  return experts.filter((expert) => {
    const haystack = [expert.name, expert.role, expert.employer, ...expert.expertise]
      .join(' ')
      .toLowerCase();
    return haystack.includes(trimmed);
  });
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