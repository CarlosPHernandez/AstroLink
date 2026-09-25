import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiRole } from '@/lib/api-auth';
import {
  listAdminExpertApplications,
  reviewExpertApplication,
} from '@/lib/expert-offer/applications';

const ReviewBodySchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approve', 'decline']),
});

/**
 * GET /api/admin/expert-applications — newest 50, no bio.
 * POST /api/admin/expert-applications — approve into an unlisted mentor, or decline.
 */
export async function GET() {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const applications = await listAdminExpertApplications();
    return NextResponse.json({ success: true, applications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load applications.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid review request.' }, { status: 400 });
  }

  try {
    const result = await reviewExpertApplication(parsed.data.id, parsed.data.decision);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    if (result.mentorId) {
      return NextResponse.json({ success: true, mentorId: result.mentorId });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not review application.';
    const slugTaken = message.startsWith('Slug "');
    return NextResponse.json(
      { success: false, error: slugTaken ? message : 'Could not review application.' },
      { status: slugTaken ? 400 : 500 },
    );
  }
}
