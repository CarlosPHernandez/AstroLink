import Link from 'next/link';

type WaitlistHeaderProps = {
  showExpertsLink: boolean;
};

export function WaitlistHeader({ showExpertsLink }: WaitlistHeaderProps) {
  return (
    <header>
      <div className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg h-12 sm:h-14 flex justify-between items-center">
        <Link
          href="/"
          className="text-sm font-medium text-on-surface hover:opacity-60 transition-opacity"
        >
          AstroLink
        </Link>
        {showExpertsLink ? (
          <Link
            href="/experts"
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Experts
          </Link>
        ) : null}
      </div>
    </header>
  );
}