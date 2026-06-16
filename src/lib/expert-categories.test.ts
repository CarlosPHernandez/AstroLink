import { describe, expect, it } from 'vitest';
import type { ExpertCategory } from '@/lib/mentor-directory';
import { filterExpertsByCategory } from './expert-categories';

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