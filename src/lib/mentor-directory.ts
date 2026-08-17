import 'server-only';

import { unstable_cache } from 'next/cache';
import { DEFAULT_MENTOR_IMAGE } from '@/lib/public-images';
import { supabase } from '@/lib/supabase';
import { inferPublicExpertCategory } from '@/lib/expert-categories';
import type { Mentor } from '@/lib/types';

export type ExpertCategory = 'careers' | 'training' | 'spacecraft' | 'policy' | 'medicine';

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
  /** Present when columns exist; treat missing as false / 0 for older fixtures. */
  videoRequestsEnabled?: boolean;
  videoRequestPriceCents?: number;
  videoRequestSlaDays?: number;
}

function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
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
    category: inferPublicExpertCategory({
      title: mentor.title,
      bio: mentor.bio,
      expertise: mentor.expertise,
    }),
    expertise: mentor.expertise,
    bio: mentor.bio,
    imageUrl: mentor.image_url ?? DEFAULT_MENTOR_IMAGE,
    introVideoUrl: mentor.intro_video_url ?? null,
    availability: mentor.stripe_onboarding_completed ? 'Available Now' : 'Book Session',
    liveSessionPriceCents: mentor.live_session_price_cents,
    stripeOnboardingCompleted: mentor.stripe_onboarding_completed,
    videoRequestsEnabled: Boolean(mentor.video_requests_enabled),
    videoRequestPriceCents: mentor.video_request_price_cents ?? 0,
    videoRequestSlaDays: mentor.video_request_sla_days ?? 7,
  };
}

async function fetchPublicMentorsFromDb(): Promise<ListedExpert[]> {
  if (!hasPublicSupabaseConfig()) {
    return [];
  }

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

async function fetchMentorBySlugFromDb(slug: string): Promise<ListedExpert | null> {
  if (!hasPublicSupabaseConfig()) {
    return null;
  }

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

async function fetchMentorByIdFromDb(id: string): Promise<ListedExpert | null> {
  if (!hasPublicSupabaseConfig()) {
    return null;
  }

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

const MENTOR_CACHE_SECONDS = 300;

/** Data cache — avoids Supabase on every homepage visit (Vercel Data Cache). */
export async function listPublicMentors(): Promise<ListedExpert[]> {
  return unstable_cache(fetchPublicMentorsFromDb, ['list-public-mentors'], {
    revalidate: MENTOR_CACHE_SECONDS,
    tags: ['mentors'],
  })();
}

export async function getMentorBySlug(slug: string): Promise<ListedExpert | null> {
  return unstable_cache(() => fetchMentorBySlugFromDb(slug), ['mentor-by-slug', slug], {
    revalidate: MENTOR_CACHE_SECONDS,
    tags: ['mentors', `mentor-slug-${slug}`],
  })();
}

export async function getMentorById(id: string): Promise<ListedExpert | null> {
  return unstable_cache(() => fetchMentorByIdFromDb(id), ['mentor-id', id], {
    revalidate: MENTOR_CACHE_SECONDS,
    tags: ['mentors', `mentor-id-${id}`],
  })();
}
