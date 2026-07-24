import Link from 'next/link';

export type SessionCompGrantBannerGrant = {
  id: string;
  creditMinutes: number;
  expiresAt: string | null;
};

type SessionCompGrantBannerProps = {
  grant: SessionCompGrantBannerGrant;
  /** When true, show book CTA (dashboard). Checkout surfaces omit the link. */
  showBookCta?: boolean;
};

function formatExpiryLabel(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(expiresAt));
}

/**
 * Account assurance for a single complimentary 15-minute session grant.
 * Hide entirely when grant is null / redeemed (caller responsibility).
 */
export function SessionCompGrantBanner({
  grant,
  showBookCta = true,
}: SessionCompGrantBannerProps) {
  const expiryLabel = formatExpiryLabel(grant.expiresAt);

  return (
    <div
      className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-left"
      data-testid="session-comp-grant-banner"
      role="status"
    >
      <p className="text-label-md font-semibold text-on-surface">
        Complimentary 15-minute session
      </p>
      <p className="mt-1 text-body-md text-on-surface-variant">
        You have <span className="font-semibold text-on-surface">one free 15-minute</span> live
        1:1 on AstroLink (with Chris or any listed expert)
        {expiryLabel ? (
          <>
            . It expires <span className="font-semibold text-on-surface">{expiryLabel}</span>
          </>
        ) : null}
        . Book a 15-minute session and choose{' '}
        <span className="font-semibold text-on-surface">Apply complimentary session</span> at
        checkout. Longer sessions are charged at the full rate.
      </p>
      {showBookCta ? (
        <Link
          href="/booking"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-label-sm font-semibold text-on-primary hover:bg-primary-container"
          data-testid="session-comp-grant-book"
        >
          Book a session
        </Link>
      ) : null}
    </div>
  );
}
