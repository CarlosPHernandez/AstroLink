import 'server-only';

import type { Database } from '@/lib/database.types';
import { isOfferPubliclyBookable } from '@/lib/expert-offers/public-access';
import { mentorToListedExpert, type ListedExpert } from '@/lib/mentor-directory';
import { supabaseAdmin } from '@/lib/supabase';
import type { Mentor } from '@/lib/types';

type ExpertOfferRow = Database['public']['Tables']['expert_offers']['Row'];

const MENTOR_PUBLIC_FIELDS =
  'id, slug, full_name, title, employer, expertise, bio, image_url, intro_video_url, live_session_price_cents, video_requests_enabled, video_request_price_cents, video_request_sla_days, stripe_onboarding_completed, compliance_status, is_listed, expert_offers_enabled, email, is_civil_servant, stripe_connect_account_id, created_at';

type MentorJoinRow = Mentor & {
  expert_offers_enabled: boolean;
};

type OfferWithMentor = ExpertOfferRow & {
  mentors: MentorJoinRow | MentorJoinRow[] | null;
};

export type PublicOfferLoad = {
  offer: ExpertOfferRow;
  expert: ListedExpert;
};

export async function loadPublicOffer(
  mentorSlug: string,
  offerSlug: string,
): Promise<PublicOfferLoad | null> {
  const slug = mentorSlug.trim();
  const offer = offerSlug.trim();
  if (!slug || !offer) return null;

  const { data, error } = await supabaseAdmin
    .from('expert_offers')
    .select(`*, mentors!inner(${MENTOR_PUBLIC_FIELDS})`)
    .eq('slug', offer)
    .eq('mentors.slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as OfferWithMentor;
  const mentor = Array.isArray(row.mentors) ? row.mentors[0] : row.mentors;
  if (!mentor) {
    return null;
  }

  if (
    !isOfferPubliclyBookable({
      status: row.status,
      expert_offers_enabled: Boolean(mentor.expert_offers_enabled),
      compliance_status: mentor.compliance_status,
      is_listed: mentor.is_listed,
    })
  ) {
    return null;
  }

  return {
    offer: {
      id: row.id,
      mentor_id: row.mentor_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      duration_minutes: row.duration_minutes,
      price_cents: row.price_cents,
      currency: row.currency,
      status: row.status,
      published_at: row.published_at,
      unpublished_at: row.unpublished_at,
      archived_at: row.archived_at,
      page_views: row.page_views,
      checkout_starts: row.checkout_starts,
      bookings_paid: row.bookings_paid,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    expert: mentorToListedExpert(mentor),
  };
}
