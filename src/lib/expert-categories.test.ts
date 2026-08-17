import { describe, expect, it } from 'vitest';
import type { ExpertCategory } from '@/lib/mentor-directory';
import {
  filterExpertsByCategory,
  filterExpertsByQuery,
  inferPublicExpertCategory,
  shouldClearExpertOnCategoryChange,
} from './expert-categories';

type StubExpert = { slug: string; category: ExpertCategory };

const experts: StubExpert[] = [
  { slug: 'a', category: 'careers' },
  { slug: 'b', category: 'training' },
  { slug: 'c', category: 'careers' },
];

describe('filterExpertsByCategory', () => {
  it('returns all experts when category is all', () => {
    expect(filterExpertsByCategory(experts, 'all')).toHaveLength(3);
  });

  it('filters to a single category', () => {
    expect(filterExpertsByCategory(experts, 'training')).toEqual([{ slug: 'b', category: 'training' }]);
  });

  it('returns empty when no experts match', () => {
    expect(filterExpertsByCategory(experts, 'policy')).toEqual([]);
  });

  it('lists Chris and Eiman on the astronauts tab', () => {
    const roster: StubExpert[] = [
      { slug: 'chris-sembroski', category: 'careers' },
      { slug: 'eiman-jahangir', category: 'spacecraft' },
      { slug: 'priya-nair', category: 'training' },
    ];
    expect(filterExpertsByCategory(roster, 'astronauts').map((e) => e.slug)).toEqual([
      'chris-sembroski',
      'eiman-jahangir',
    ]);
  });
});

describe('shouldClearExpertOnCategoryChange', () => {
  it('returns false when nothing is selected', () => {
    expect(shouldClearExpertOnCategoryChange(experts, null, 'training')).toBe(false);
  });

  it('returns false when the selected expert remains visible', () => {
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'careers')).toBe(false);
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'all')).toBe(false);
  });

  it('returns true when the selected expert is filtered out', () => {
    expect(shouldClearExpertOnCategoryChange(experts, 'a', 'training')).toBe(true);
    expect(shouldClearExpertOnCategoryChange(experts, 'b', 'careers')).toBe(true);
  });
});

type QueryExpert = { name: string; role: string; employer: string; expertise: string[] };

const queryExperts: QueryExpert[] = [
  {
    name: 'Chris Sembroski',
    role: 'Astronaut',
    employer: 'Inspiration4',
    expertise: ['flight ops'],
  },
  {
    name: 'Eiman Jahangir',
    role: 'Cardiologist',
    employer: 'NASA',
    expertise: ['propulsion', 'medicine'],
  },
];

describe('inferPublicExpertCategory', () => {
  it('places Andrew in training from crew-trainer language', () => {
    expect(
      inferPublicExpertCategory({
        title: 'President & Co-founder of The Inspired24',
        bio: 'dedicated spaceflight crew trainer and Neutral Buoyancy Laboratory instructor',
        expertise: ['Space flight training'],
      }),
    ).toBe('training');
  });

  it('places Priya in careers from student and internship language', () => {
    expect(
      inferPublicExpertCategory({
        title: 'Director of Research',
        bio: 'helps ambitious students build careers, explore STEM, and prepare for internships',
        expertise: [],
      }),
    ).toBe('careers');
  });

  it('places Eiman in medicine from cardiologist language', () => {
    expect(
      inferPublicExpertCategory({
        title: 'Cardiologist and astronaut',
        bio: 'two decades of experience in medicine and going into space',
        expertise: [],
      }),
    ).toBe('medicine');
  });

  it('places Jenni in policy from security language, not defense-tech terms', () => {
    expect(
      inferPublicExpertCategory({
        title: 'Counter Intelligence',
        bio: 'provides vulnerability assessments for critical infrastructure and risk management',
        expertise: [],
      }),
    ).toBe('policy');
  });

  it('does not classify on propulsion or engine keywords', () => {
    expect(
      inferPublicExpertCategory({
        title: 'Propulsion engineer',
        bio: 'ion engine and launch vehicle work',
        expertise: ['propulsion', 'engine'],
      }),
    ).toBe('careers');
  });
});

describe('filterExpertsByQuery', () => {
  it('returns all experts unchanged when the query is empty or whitespace', () => {
    expect(filterExpertsByQuery(queryExperts, '')).toEqual(queryExperts);
    expect(filterExpertsByQuery(queryExperts, '   ')).toEqual(queryExperts);
  });

  it('matches by name, case-insensitively', () => {
    expect(filterExpertsByQuery(queryExperts, 'CHRIS')).toEqual([queryExperts[0]]);
  });

  it('matches by role', () => {
    expect(filterExpertsByQuery(queryExperts, 'cardiologist')).toEqual([queryExperts[1]]);
  });

  it('matches by employer', () => {
    expect(filterExpertsByQuery(queryExperts, 'nasa')).toEqual([queryExperts[1]]);
  });

  it('matches by an expertise array entry', () => {
    expect(filterExpertsByQuery(queryExperts, 'propulsion')).toEqual([queryExperts[1]]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterExpertsByQuery(queryExperts, 'zzz-no-match')).toEqual([]);
  });
});