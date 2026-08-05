import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

async function resolveMentorId(userId: string, email: string): Promise<string | null> {
  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let mentorId = (mentor as { id?: string } | null)?.id;
  if (!mentorId) {
    const { data: byEmail } = await supabaseAdmin
      .from('mentors')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    mentorId = (byEmail as { id?: string } | null)?.id;
  }
  return mentorId ?? null;
}

/**
 * Mentor-private session feedback. Strips admin-only diagnosis dump and consent_notes.
 * Includes short verdict + reason so mentors see flagged items without model JSON.
 */
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'mentor' && session.role !== 'admin')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const mentorId = await resolveMentorId(session.userId, session.email);
  if (!mentorId) {
    return NextResponse.json({ success: false, error: 'Mentor profile not found' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('expert_reviews')
    .select(
      'id, rating, quote, display_name, attribution_type, status, consent_to_publish, moderation_verdict, moderation_reason, auto_published, created_at, booking_id',
    )
    .eq('expert_id', mentorId)
    .neq('status', 'withdrawn')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const reviews = (data ?? []).map((row) => {
    const r = row as {
      id: string;
      rating: number;
      quote: string;
      display_name: string;
      attribution_type: string;
      status: string;
      consent_to_publish: boolean;
      moderation_verdict: string;
      moderation_reason: string | null;
      auto_published: boolean;
      created_at: string;
      booking_id: string | null;
    };
    return {
      id: r.id,
      rating: r.rating,
      quote: r.quote,
      displayName: r.display_name,
      attributionType: r.attribution_type,
      status: r.status,
      consentToPublish: r.consent_to_publish,
      moderationVerdict: r.moderation_verdict,
      moderationReason: r.moderation_reason,
      autoPublished: r.auto_published,
      createdAt: r.created_at,
      bookingId: r.booking_id,
      isFlagged: r.moderation_verdict === 'flagged' || r.moderation_verdict === 'error',
    };
  });

  return NextResponse.json({ success: true, reviews });
}
