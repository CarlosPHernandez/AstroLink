import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { PathAssessmentReviewAgent } from '@/services/agents/path-assessment-review-agent';

export const runtime = 'nodejs';

const bodySchema = z.object({
  writtenResponse: z.string().min(40).max(12000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== 'mentor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  try {
    const agent = new PathAssessmentReviewAgent();
    await agent.deliver({
      reviewId: id.trim(),
      mentorUserId: session.userId,
      writtenResponse: parsed.data.writtenResponse,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deliver failed';
    const status = /not found|cannot be delivered|must be/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
