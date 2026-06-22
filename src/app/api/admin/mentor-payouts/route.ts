import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiRole } from '@/lib/api-auth';
import {
  getMentorAwaitingTransferCents,
  listMentorsWithAwaitingPayouts,
  listUnpaidMentorTransactions,
  markMentorTransactionsPaid,
} from '@/lib/mentor-manual-payouts';
import { supabaseAdmin } from '@/lib/supabase';

const MarkPaidSchema = z.object({
  mentorId: z.string().uuid('mentorId must be a valid UUID.'),
  transactionIds: z
    .array(z.string().uuid('Each transactionId must be a valid UUID.'))
    .min(1, 'Select at least one session.'),
  referenceNote: z.string().trim().max(500).optional(),
  paidAt: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const mentorId = new URL(request.url).searchParams.get('mentorId');

  if (!mentorId) {
    const mentors = await listMentorsWithAwaitingPayouts();
    return NextResponse.json({ success: true, mentors });
  }

  if (!z.string().uuid().safeParse(mentorId).success) {
    return NextResponse.json(
      { success: false, error: 'mentorId must be a valid UUID.' },
      { status: 400 },
    );
  }

  const [{ data: mentor, error: mentorError }, unpaidTransactions, awaitingCents] =
    await Promise.all([
      supabaseAdmin.from('mentors').select('id, full_name').eq('id', mentorId).maybeSingle(),
      listUnpaidMentorTransactions(mentorId),
      getMentorAwaitingTransferCents(mentorId),
    ]);

  if (mentorError) {
    return NextResponse.json({ success: false, error: mentorError.message }, { status: 500 });
  }

  if (!mentor) {
    return NextResponse.json({ success: false, error: 'Mentor not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    mentor: {
      id: mentor.id,
      fullName: mentor.full_name,
      awaitingCents,
    },
    unpaidTransactions,
  });
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const body = await request.json();
    const parsed = MarkPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await markMentorTransactionsPaid({
      mentorId: parsed.data.mentorId,
      transactionIds: parsed.data.transactionIds,
      adminUserId: sessionOrResponse.userId,
      referenceNote: parsed.data.referenceNote,
      paidAt: parsed.data.paidAt,
    });

    if (!result.ok) {
      const status =
        result.code === 'TRANSACTION_ALREADY_PAID'
          ? 409
          : result.code === 'MENTOR_NOT_FOUND' || result.code === 'TRANSACTION_NOT_FOUND'
            ? 404
            : 400;

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.message,
          existingPayoutId: result.existingPayoutId,
          transactionId: result.transactionId,
        },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      totalCents: result.totalCents,
      lineCount: result.lineCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not mark payout.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}