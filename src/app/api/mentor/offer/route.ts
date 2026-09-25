import { NextResponse } from 'next/server';
import { getMentorOffer, saveMentorOffer } from '@/lib/expert-offer/offer';
import { MentorOfferSchema } from '@/lib/expert-offer/schema';
import { requireMentorSession } from '@/lib/mentor-activation/require-activated-mentor';

function gateDenied(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export async function GET() {
  const gate = await requireMentorSession();
  if (!gate.ok) return gateDenied(gate.message);

  try {
    const offer = await getMentorOffer(gate.session.userId);
    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Expert profile not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(offer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load offer.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const gate = await requireMentorSession();
  if (!gate.ok) return gateDenied(gate.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid offer.' }, { status: 400 });
  }

  const parsed = MentorOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid offer.' },
      { status: 400 },
    );
  }

  try {
    await saveMentorOffer(gate.session.userId, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not save offer.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
