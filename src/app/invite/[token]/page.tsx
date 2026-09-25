import type { Metadata } from 'next';
import { headers } from 'next/headers';

import '@/components/chris-campaign/chris-landing.css';
import { InviteClaimButton } from '@/app/invite/[token]/invite-claim-button';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { getApprovedReviewsForExpert } from '@/lib/expert-reviews/get-approved-reviews';
import {
  assertGuestInviteLookupRateLimit,
  guestInviteClientIp,
  isGuestInviteRateLimitError,
} from '@/lib/guest-invite-rate-limit';
import { GUEST_INVITE_REFERRER } from '@/lib/guest-invite-constants';
import { getClaimedInviteForUser, lookupGuestInvite } from '@/lib/guest-session-invites';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { formatGrantExpiryLabel } from '@/lib/session-comp-grants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'A session with Chris Sembroski',
};

const EXAMPLE_QUESTIONS = [
  'How did you get from where you were into this industry?',
  'What should I have ready before I talk to a recruiter or a hiring manager?',
  'Who hires for this kind of work, and what do they actually look for?',
];

type PageProps = { params: Promise<{ token: string }> };

export default async function GuestInvitePage({ params }: PageProps) {
  const { token } = await params;
  const headerList = await headers();
  const request = new Request('https://astro-link.space/invite', { headers: headerList });

  try {
    assertGuestInviteLookupRateLimit(guestInviteClientIp(request));
  } catch (error) {
    if (isGuestInviteRateLimitError(error)) {
      return <DeadState message="Try again shortly." />;
    }
    throw error;
  }

  let lookedUp: Awaited<ReturnType<typeof lookupGuestInvite>>;
  try {
    lookedUp = await lookupGuestInvite(token);
  } catch (error) {
    console.error('guest invite page:', error);
    return <DeadState message="We couldn't open this link. Try again shortly." />;
  }
  if (lookedUp.kind === 'invalid') {
    return <DeadState message="This link is not valid." />;
  }
  if (lookedUp.kind === 'expired') {
    return <DeadState message="This invite has expired." />;
  }
  if (lookedUp.kind === 'revoked') {
    return <DeadState message="This invite is no longer available." />;
  }

  const session = await getSession();
  const mentor = await getMentorBySlug(getChrisMentorSlug());
  const reviews = mentor ? await getApprovedReviewsForExpert(mentor.id) : [];
  const claimed =
    session && lookedUp.kind === 'used'
      ? await getClaimedInviteForUser(session.userId).catch(() => null)
      : null;
  const alreadyMine = Boolean(claimed);
  const expiresLabel =
    lookedUp.kind === 'offer' || lookedUp.kind === 'used'
      ? formatGrantExpiryLabel(lookedUp.expiresAt)
      : null;
  const returnPath = `/invite/${token}`;
  const bookingPath = alreadyMine
    ? `/booking?mentor=${encodeURIComponent(mentor?.slug ?? 'chris-sembroski')}&campaign=chris&ref=${encodeURIComponent(GUEST_INVITE_REFERRER)}`
    : null;

  if (lookedUp.kind === 'used' && !alreadyMine) {
    return <DeadState message="This invite has already been used." />;
  }

  return (
    <div className="chris-landing min-h-screen bg-primary-container px-6 py-10 text-white">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6">
        {mentor?.imageUrl ? (
          // Campaign portrait. Next/Image requires known hosts; a plain img matches other Chris surfaces that already allow this URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mentor.imageUrl}
            alt={mentor.name}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : null}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight">
            Free 25-minute call with Chris Sembroski
          </h1>
          <p className="text-base leading-relaxed text-white/80">
            A conversation to talk through your search. This is not a job offer and not a promised
            introduction.
          </p>
          {expiresLabel ? (
            <p className="text-sm text-white/60">Expires {expiresLabel}.</p>
          ) : null}
        </div>
        <InviteClaimButton
          token={token}
          signedIn={Boolean(session)}
          authHref={toAuthWithRedirect(returnPath)}
          bookingPath={bookingPath}
        />
        <section className="space-y-3 border-t border-white/15 pt-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/60">
            What you can ask
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-white/85">
            {EXAMPLE_QUESTIONS.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-white/75">
            Chris has done the work, including flying, and he can tell you what is real about
            getting into the industry. He does not place you in a job from this page.
          </p>
        </section>
        {reviews.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-widest text-white/60">
              From people who have sat with him
            </h2>
            {reviews.map((review) => (
              <blockquote key={review.id} className="text-sm leading-relaxed text-white/85">
                <p>“{review.quote}”</p>
                <footer className="mt-1 text-white/55">
                  {review.displayName} · {review.rating} of 5
                </footer>
              </blockquote>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function DeadState({ message }: { message: string }) {
  return (
    <div className="chris-landing flex min-h-screen flex-col items-center justify-center bg-primary-container px-6 text-center text-white">
      <h1 className="mb-3 text-2xl font-semibold">We couldn’t open this link</h1>
      <p className="max-w-md text-sm leading-relaxed text-white/70">{message}</p>
    </div>
  );
}
