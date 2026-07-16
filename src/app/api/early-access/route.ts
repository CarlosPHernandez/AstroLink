import { NextResponse } from 'next/server';

const WAITLIST_CLOSED_MESSAGE =
  'Early access signup is closed. Book a session at astro-link.space/talk-with-chris.';

/**
 * Public waitlist signup API — retired with the /early-access page.
 * Existing rows in `early_access_signups` are unchanged; admin metrics still read them.
 */
export async function POST() {
  return NextResponse.json({ success: false, error: WAITLIST_CLOSED_MESSAGE }, { status: 410 });
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}