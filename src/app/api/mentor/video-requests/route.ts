import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { isVideoRequestOverdue } from '@/lib/video-requests/state';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'mentor' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle();

  // Fallback: email match for mentors without user_id link
  let mentorId = (mentor as { id?: string } | null)?.id;
  if (!mentorId) {
    const { data: byEmail } = await supabaseAdmin
      .from('mentors')
      .select('id')
      .eq('email', session.email)
      .maybeSingle();
    mentorId = (byEmail as { id?: string } | null)?.id;
  }

  if (!mentorId) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
  }

  const filter = new URL(request.url).searchParams.get('status') ?? 'open';
  let query = supabaseAdmin
    .from('video_requests')
    .select(
      'id, status, occasion, from_name, recipient_name, buyer_email, price_cents, paid_at, due_at, delivered_at, instructions',
    )
    .eq('mentor_id', mentorId)
    .order('due_at', { ascending: true, nullsFirst: false });

  if (filter === 'open') {
    query = query.eq('status', 'paid_awaiting_expert');
  } else if (filter === 'delivered') {
    query = query.eq('status', 'delivered');
  }

  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => {
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
    };
    return {
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
      instructionsPreview: r.instructions.slice(0, 140),
      isOverdue: isVideoRequestOverdue({ status: r.status, dueAt: r.due_at }),
    };
  });

  return NextResponse.json({ items });
}
