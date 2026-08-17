import type { ExpertCategory } from '@/lib/mentor-directory';

export const EXPERT_CATEGORIES = [
  'all',
  'astronauts',
  'medicine',
  'careers',
  'training',
  'spacecraft',
  'policy',
] as const;

export type ExpertCategoryFilterValue = (typeof EXPERT_CATEGORIES)[number];

export const EXPERT_CATEGORY_LABELS: Record<ExpertCategoryFilterValue, string> = {
  all: 'All',
  astronauts: 'Astronauts',
  medicine: 'Medicine',
  careers: 'Careers',
  training: 'Training',
  spacecraft: 'Spacecraft',
  policy: 'Policy',
};

/** Public-safe inference — no export-control / weapons / propulsion jargon. */
const CATEGORY_KEYWORDS: Record<ExpertCategory, string[]> = {
  medicine: ['cardiologist', 'medicine', 'medical', 'physician', 'clinical'],
  training: ['training', 'trainer', 'nbl', 'zero-g', 'zero g', 'parabolic', 'crew training'],
  spacecraft: ['spacecraft', 'habitation', 'eva', 'orbital', 'iss', 'life support'],
  policy: ['policy', 'compliance', 'regulation', 'security', 'infrastructure', 'risk management'],
  careers: ['career', 'intern', 'college', 'stem', 'student', 'founder', 'speaker', 'keynote', 'mentorship'],
};

export function inferPublicExpertCategory(input: {
  title?: string | null;
  bio?: string | null;
  expertise?: string[];
}): ExpertCategory {
  const haystack = [input.title ?? '', input.bio ?? '', ...(input.expertise ?? [])]
    .join(' ')
    .toLowerCase();
  for (const category of ['medicine', 'training', 'policy', 'careers', 'spacecraft'] as const) {
    if (CATEGORY_KEYWORDS[category].some((kw) => haystack.includes(kw))) {
      return category;
    }
  }
  return 'careers';
}

/** Directory tab only — not a stored mentor category. */
const ASTRONAUT_DIRECTORY_SLUGS = new Set(['chris-sembroski', 'eiman-jahangir']);

export function filterExpertsByCategory<T extends { category: ExpertCategory; slug?: string }>(
  experts: T[],
  category: string,
): T[] {
  if (category === 'all') {
    return experts;
  }
  if (category === 'astronauts') {
    return experts.filter((expert) => Boolean(expert.slug && ASTRONAUT_DIRECTORY_SLUGS.has(expert.slug)));
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
export function shouldClearExpertOnCategoryChange<
  T extends { slug: string; category: ExpertCategory },
>(
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