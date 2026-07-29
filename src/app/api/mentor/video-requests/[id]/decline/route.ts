import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { VideoRequestAgent } from '@/services/agents/video-request-agent';

const bodySchema = z.object({
  reason: z.string().min(3).max(500),
});

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

export async function POST(
  request: Request,
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
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Reason required' }, { status: 400 });
  }

  try {
    const agent = new VideoRequestAgent();
    await agent.decline({
      videoRequestId: id,
      mentorId,
      reason: parsed.data.reason,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Decline failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
