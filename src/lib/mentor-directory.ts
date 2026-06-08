import 'server-only';

import { supabase } from '@/lib/supabase';
import type { Mentor } from '@/lib/types';

export type ExpertCategory = 'systems' | 'propulsion' | 'spacecraft' | 'policy';

export interface ListedExpert {
  id: string;
  slug: string;
  name: string;
  role: string;
  employer: string;
  rate: number;
  category: ExpertCategory;
  expertise: string[];
  bio: string;
  imageUrl: string;
  introVideoUrl: string | null;
  availability: 'Available Now' | 'Book Session';
  liveSessionPriceCents: number;
  stripeOnboardingCompleted: boolean;
}

const CATEGORY_KEYWORDS: Record<ExpertCategory, string[]> = {
  propulsion: ['propulsion', 'ion', 'engine', 'launch'],
  spacecraft: ['spacecraft', 'habitation', 'eva', 'orbital', 'iss'],
  policy: ['policy', 'compliance', 'nf-1860', 'federal', 'budget', 'regulation'],
  systems: ['systems', 'integration', 'avionics', 'operations', 'strategy'],
};

function inferCategory(expertise: string[]): ExpertCategory {
  const haystack = expertise.join(' ').toLowerCase();
  for (const category of ['propulsion', 'spacecraft', 'policy', 'systems'] as const) {
    if (CATEGORY_KEYWORDS[category].some((kw) => haystack.includes(kw))) {
      return category;
    }
  }
  return 'systems';
}

export function mentorToListedExpert(mentor: Mentor): ListedExpert {
  const slug = mentor.slug ?? mentor.id;
  return {
    id: mentor.id,
    slug,
    name: mentor.full_name,
    role: mentor.title ?? 'Aerospace Expert',
    employer: mentor.employer,
    rate: Math.round(mentor.live_session_price_cents / 100),
    category: inferCategory(mentor.expertise),
    expertise: mentor.expertise,
    bio: mentor.bio,
    imageUrl: mentor.image_url ?? '/chris_sembroski.jpeg',
    introVideoUrl: mentor.intro_video_url ?? null,
    availability: mentor.stripe_onboarding_completed ? 'Available Now' : 'Book Session',
    liveSessionPriceCents: mentor.live_session_price_cents,
    stripeOnboardingCompleted: mentor.stripe_onboarding_completed,
  };
}

export async function listPublicMentors(): Promise<ListedExpert[]> {
  const { data, error } = await supabase
    .from('mentors')
    .select('*')
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .order('full_name');

  if (error) {
    console.error('listPublicMentors:', error.message);
    return [];
  }

  return (data ?? []).map((row) => mentorToListedExpert(row as Mentor));
}

export async function getMentorBySlug(slug: string): Promise<ListedExpert | null> {
  const { data, error } = await supabase
    .from('mentors')
    .select('*')
    .eq('slug', slug)
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mentorToListedExpert(data as Mentor);
}

export async function getMentorById(id: string): Promise<ListedExpert | null> {
  const { data, error } = await supabase
    .from('mentors')
    .select('*')
    .eq('id', id)
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mentorToListedExpert(data as Mentor);
}
