import type { Metadata } from 'next';
import { headers } from 'next/headers';

import '@/components/chris-campaign/chris-landing.css';
import { InviteClaimButton } from '@/app/invite/[token]/invite-claim-button';
import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import {
  assertGuestInviteLookupRateLimit,
  guestInviteClientIp,
  isGuestInviteRateLimitError,
} from '@/lib/guest-invite-rate-limit';
import { GUEST_INVITE_REFERRER } from '@/lib/guest-invite-constants';
import { getClaimedInviteForUser, lookupGuestInvite } from '@/lib/guest-session-invites';
import { publicExpertCopyForSlug } from '@/lib/experts/public-expert-copy';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { formatGrantExpiryLabel } from '@/lib/session-comp-grants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'A session with Chris Sembroski',
};

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
  const copy = mentor ? publicExpertCopyForSlug(mentor.slug) : null;
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
      <main className="chris-mobile-max mx-auto flex w-full flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">
            Free 25-minute session
          </p>
          <h1 className="text-4xl font-semibold leading-none tracking-tight">
            {mentor?.name ?? 'Chris Sembroski'}
          </h1>
          <p className="text-lg font-medium leading-snug text-white/90">
            {copy?.title ?? mentor?.role ?? 'Commercial astronaut'}
          </p>
          {copy?.proof ? <p className="text-sm text-white/55">{copy.proof}</p> : null}
        </header>

        {mentor ? (
          <ExpertIntroMedia
            name={mentor.name}
            imageUrl={mentor.imageUrl}
            introVideoUrl={mentor.introVideoUrl}
            priority
            overlayVariant="minimal"
            className="aspect-[3/4] w-full border-white/15"
          />
        ) : null}

        {mentor?.bio ? <ChrisBio bio={mentor.bio} /> : null}

        <div className="flex flex-col gap-3">
          {expiresLabel ? (
            <p className="text-xs text-white/45">Offer expires {expiresLabel}.</p>
          ) : null}
          <InviteClaimButton
            token={token}
            signedIn={Boolean(session)}
            authHref={toAuthWithRedirect(returnPath)}
            bookingPath={bookingPath}
          />
        </div>
      </main>
    </div>
  );
}

type BioBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'labeled'; label: string; text: string };

function chrisBioBlocks(bio: string): BioBlock[] {
  return bio
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => {
      const labeled = text.match(/^([^:]{3,40}):\s+(\S[\s\S]*)$/);
      if (labeled && labeled[1].split(' ').length <= 6) {
        return { kind: 'labeled', label: labeled[1], text: labeled[2] };
      }
      const isHeading = text.length <= 40 && !/[.!?]$/.test(text) && !text.includes(':');
      if (isHeading) return { kind: 'heading', text };
      return { kind: 'paragraph', text };
    });
}

function ChrisBio({ bio }: { bio: string }) {
  const blocks = chrisBioBlocks(bio);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h2
              key={`${block.kind}-${index}`}
              className="pt-3 text-xs font-medium uppercase tracking-widest text-white/45"
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === 'labeled') {
          return (
            <p key={`${block.kind}-${index}`} className="text-base font-light leading-relaxed text-white/80">
              <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-white/45">
                {block.label}
              </span>
              {block.text}
            </p>
          );
        }
        return (
          <p key={`${block.kind}-${index}`} className="text-base font-light leading-relaxed text-white/80">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function DeadState({ message }: { message: string }) {
  return (
    <div className="chris-landing flex min-h-screen flex-col items-center justify-center bg-primary-container px-6 text-center text-white">
      <h1 className="mb-3 text-2xl font-semibold">We couldn’t open this link</h1>
      <p className="chris-copy-max text-sm leading-relaxed text-white/70">{message}</p>
    </div>
  );
}
