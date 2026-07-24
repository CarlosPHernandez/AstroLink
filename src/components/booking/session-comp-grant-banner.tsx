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
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-surface-container-lowest shadow-[0_8px_28px_rgba(26,27,31,0.06)]"
      data-testid="session-comp-grant-banner"
      role="status"
    >
      {/* Soft primary wash + left accent */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-primary/[0.03] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary"
        aria-hidden
      />

      <div
        className={`relative flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-start sm:gap-5 ${
          showBookCta ? 'sm:pr-6' : ''
        }`}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
          aria-hidden
        >
          <span className="material-symbols-outlined text-[26px] leading-none">redeem</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-primary">
            Your complimentary offer
          </p>
          <h2 className="mt-1.5 text-lg font-bold tracking-tight text-on-surface sm:text-xl">
            Free {minutes}-minute live 1:1
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Use it with Chris or any listed expert. At checkout, set duration to{' '}
            <span className="font-semibold text-on-surface">{minutes} minutes</span> and turn on{' '}
            <span className="font-semibold text-on-surface">Apply complimentary session</span>.
            Longer sessions are charged at the full rate.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <span className="material-symbols-outlined text-[14px] leading-none">schedule</span>
              {minutes} min free
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] leading-none">group</span>
              Any listed expert
            </span>
            {expiryLabel ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant"
                data-testid="session-comp-grant-expiry"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">
                  event
                </span>
                Expires {expiryLabel}
              </span>
            ) : null}
          </div>

          {showBookCta ? (
            <div className="mt-5">
              <Link
                href="/booking"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                data-testid="session-comp-grant-book"
              >
                Book free session
                <span className="material-symbols-outlined text-[18px] leading-none">
                  arrow_forward
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
