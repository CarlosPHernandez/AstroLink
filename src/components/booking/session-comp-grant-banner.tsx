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
  const minutes = grant.creditMinutes > 0 ? grant.creditMinutes : 15;

  return (
    <div
      className="rounded-md border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 text-left"
      data-testid="session-comp-grant-banner"
      role="status"
    >
      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-on-surface-variant">
        Complimentary session
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-on-surface sm:text-xl">
        Free {minutes}-minute live 1:1
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
        One free session with Chris or any listed expert. At checkout, choose a{' '}
        {minutes}-minute booking and select{' '}
        <span className="font-medium text-on-surface">Apply complimentary session</span>. Longer
        sessions are full price
        {expiryLabel ? (
          <>
            . Offer expires <span className="font-medium text-on-surface">{expiryLabel}</span>
          </>
        ) : null}
        .
      </p>
      {showBookCta ? (
        <Link
          href="/booking"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors hover:border-outline hover:bg-surface-container-low"
          data-testid="session-comp-grant-book"
        >
          Book session
        </Link>
      ) : null}
    </div>
  );
}
