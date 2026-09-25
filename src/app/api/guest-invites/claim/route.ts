import { NextResponse } from 'next/server';

import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { GUEST_INVITE_REFERRER } from '@/lib/guest-invite-constants';
import {
  assertGuestInviteClaimRateLimit,
  guestInviteClientIp,
  isGuestInviteRateLimitError,
} from '@/lib/guest-invite-rate-limit';
import {
  claimGuestInvite,
  GuestInviteClaimError,
} from '@/lib/guest-session-invites';
import { getSession } from '@/lib/session';

function bookingPath(): string {
  const params = new URLSearchParams({
    mentor: getChrisMentorSlug(),
    campaign: 'chris',
    ref: GUEST_INVITE_REFERRER,
  });
  return `/booking?${params.toString()}`;
}

function statusFor(code: GuestInviteClaimError['code']): number {
  if (code === 'expired') return 410;
  if (code === 'email_mismatch' || code === 'used' || code === 'revoked') return 409;
  return 404;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'mentee') {
    return NextResponse.json({ success: false, error: 'Sign in as a buyer to claim this invite.' }, { status: 401 });
  }

  try {
    assertGuestInviteClaimRateLimit(guestInviteClientIp(request), session.userId);
  } catch (error) {
    if (isGuestInviteRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)) } },
      );
    }
    throw error;
  }

  let token = '';
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
  } catch {
    token = '';
  }
  if (!token) {
    return NextResponse.json({ success: false, error: 'This link is not valid.' }, { status: 404 });
  }

  try {
    const invite = await claimGuestInvite({
      token,
      userId: session.userId,
      email: session.email,
    });
    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      bookingPath: bookingPath(),
    });
  } catch (error) {
    if (error instanceof GuestInviteClaimError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusFor(error.code) },
      );
    }
    const message = error instanceof Error ? error.message : 'Claim failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
