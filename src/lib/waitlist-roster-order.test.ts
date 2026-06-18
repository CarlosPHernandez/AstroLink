import { describe, expect, it } from 'vitest';
import type { ListedExpert } from '@/lib/mentor-directory';
import {
  WAITLIST_FEATURED_EXPERT_SLUG,
  orderWaitlistRoster,
} from '@/lib/waitlist-roster-order';

function expert(slug: string, name: string): ListedExpert {
  return {
    id: slug,
    slug,
    name,
    role: 'Expert',
    employer: 'Org',
    rate: 100,
    category: 'systems',
    expertise: [],
    bio: 'Bio',
    imageUrl: '/img.jpg',
    introVideoUrl: null,
    availability: 'Book Session',
    liveSessionPriceCents: 10_000,
    stripeOnboardingCompleted: false,
  };
}

describe('orderWaitlistRoster', () => {
  it('places Chris Sembroski first when present', () => {
    const ordered = orderWaitlistRoster([
      expert('andrew-parris', 'Andrew Parris'),
      expert(WAITLIST_FEATURED_EXPERT_SLUG, 'Chris Sembroski'),
      expert('carlos-hernandez', 'Carlos Hernandez'),
    ]);

    expect(ordered[0]?.slug).toBe(WAITLIST_FEATURED_EXPERT_SLUG);
    expect(ordered.slice(1).map((e) => e.slug)).toEqual([
      'andrew-parris',
      'carlos-hernandez',
    ]);
  });

  it('alphabetizes the remaining experts', () => {
    const ordered = orderWaitlistRoster([
      expert('zoe', 'Zoe'),
      expert('amy', 'Amy'),
    ]);

    expect(ordered.map((e) => e.slug)).toEqual(['amy', 'zoe']);
  });
});