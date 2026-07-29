import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyVideoAccessToken } from '@/lib/video-requests/access-token';
import { VideoRequestAgent } from '@/services/agents/video-request-agent';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t')?.trim() ?? '';
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const verified = verifyVideoAccessToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: 'Link unavailable', reason: verified.reason }, { status: 404 });
  }

  const { data: row, error } = await supabaseAdmin
    .from('video_requests')
    .select(
      'id, status, occasion, from_name, recipient_name, due_at, delivered_at, mentor_id, buyer_email',
    )
    .eq('id', verified.payload.videoRequestId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const vr = row as {
    id: string;
    status: string;
    occasion: string;
    from_name: string;
    recipient_name: string | null;
    due_at: string | null;
    delivered_at: string | null;
    mentor_id: string;
    buyer_email: string;
  };

  if (vr.buyer_email.toLowerCase() !== verified.payload.email.toLowerCase()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('full_name, slug, image_url')
    .eq('id', vr.mentor_id)
    .maybeSingle();

  const expert = mentor as {
    full_name?: string;
    slug?: string | null;
    image_url?: string | null;
  } | null;

  let mediaUrl: string | null = null;
  if (vr.status === 'delivered') {
    const agent = new VideoRequestAgent();
    mediaUrl = await agent.createWatchMediaUrl({ videoRequestId: vr.id });
  }

  return NextResponse.json({
    status: vr.status,
    occasion: vr.occasion,
    fromName: vr.from_name,
    recipientName: vr.recipient_name,
    dueAt: vr.due_at,
    deliveredAt: vr.delivered_at,
    expertName: expert?.full_name ?? 'Expert',
    expertSlug: expert?.slug ?? null,
    expertImageUrl: expert?.image_url ?? null,
    mediaUrl,
  });
}
