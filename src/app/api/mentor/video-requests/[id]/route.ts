import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { isVideoRequestOverdue } from '@/lib/video-requests/state';

async function resolveMentorId(userId: string, email: string): Promise<string | null> {
  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if ((mentor as { id?: string } | null)?.id) {
    return (mentor as { id: string }).id;
  }
  const { data: byEmail } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return (byEmail as { id?: string } | null)?.id ?? null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || (session.role !== 'mentor' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const mentorId = await resolveMentorId(session.userId, session.email);
  if (!mentorId) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
  }

  const { id } = await context.params;
  const { data: row, error } = await supabaseAdmin
    .from('video_requests')
    .select('*')
    .eq('id', id)
    .eq('mentor_id', mentorId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const r = row as {
    id: string;
    status: 'paid_awaiting_expert' | 'delivered' | 'declined' | 'expired' | 'refunded' | 'pending_payment';
    occasion: string;
    from_name: string;
    recipient_name: string | null;
    buyer_email: string;
    price_cents: number;
    paid_at: string | null;
    due_at: string | null;
    delivered_at: string | null;
    instructions: string;
    pronunciation_notes: string | null;
    decline_reason: string | null;
  };

  return NextResponse.json({
    id: r.id,
    status: r.status,
    occasion: r.occasion,
    fromName: r.from_name,
    recipientName: r.recipient_name,
    buyerEmail: r.buyer_email,
    priceCents: r.price_cents,
    paidAt: r.paid_at,
    dueAt: r.due_at,
    deliveredAt: r.delivered_at,
    instructions: r.instructions,
    pronunciationNotes: r.pronunciation_notes,
    declineReason: r.decline_reason,
    isOverdue: isVideoRequestOverdue({ status: r.status, dueAt: r.due_at }),
  });
}
