import { describe, expect, it } from 'vitest';
import type { ExpertCategory } from '@/lib/mentor-directory';
import { filterExpertsByCategory, shouldClearExpertOnCategoryChange } from './expert-categories';

type StubExpert = { slug: string; category: ExpertCategory };

const experts: StubExpert[] = [
  { slug: 'a', category: 'systems' },
  { slug: 'b', category: 'propulsion' },
  { slug: 'c', category: 'systems' },
];

describe('filterExpertsByCategory', () => {
  it('returns all experts when category is all', () => {
    expect(filterExpertsByCategory(experts, 'all')).toHaveLength(3);
  });

  it('filters to a single category', () => {
    expect(filterExpertsByCategory(experts, 'propulsion')).toEqual([{ slug: 'b', category: 'propulsion' }]);
  });

  it('returns empty when no experts match', () => {
    expect(filterExpertsByCategory(experts, 'policy')).toEqual([]);
  });
});

describe('shouldClearExpertOnCategoryChange', () => {
  it('returns false when nothing is selected', () => {
    expect(shouldClearExpertOnCategoryChange(experts, null, 'propulsion')).toBe(false);
  });

  it('returns false when the selected expert remains visible', () => {
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'systems')).toBe(false);
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'all')).toBe(false);
  });

  it('returns true when the selected expert is filtered out', () => {
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'propulsion')).toBe(true);
    expect(shouldClearExpertOnCategoryChange(experts, 'b', 'systems')).toBe(true);
  });
});