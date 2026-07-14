import Link from 'next/link';

type ChrisLandingFooterProps = {
  copyrightYear: number;
};

export function ChrisLandingFooter({ copyrightYear }: ChrisLandingFooterProps) {
  return (
    <footer
      className="mt-auto border-t border-outline-variant/10 bg-primary-container"
      data-testid="chris-landing-footer"
    >
      <div className="chris-fade-in-up chris-delay-500 mx-auto flex w-full max-w-[80rem] flex-col items-center justify-between gap-5 px-6 py-8 md:flex-row md:gap-6 md:px-12 md:py-10">
        <div className="text-lg font-bold tracking-tight text-secondary-fixed-dim">
          AstroLink
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:space-x-0 md:gap-x-8"
          aria-label="Legal and company"
        >
          <Link
            href="/press"
            className="chris-footer-link text-sm font-light text-secondary-fixed-dim transition-colors duration-200 hover:text-tertiary-fixed-dim"
          >
            Press
          </Link>
          <Link
            href="/privacy"
            className="chris-footer-link text-sm font-light text-secondary-fixed-dim transition-colors duration-200 hover:text-tertiary-fixed-dim"
          >
            Privacy Policy
          </Link>
          <Link
            href="/privacy"
            className="chris-footer-link text-sm font-light text-secondary-fixed-dim transition-colors duration-200 hover:text-tertiary-fixed-dim"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:hello@astro-link.space"
            className="chris-footer-link text-sm font-light text-secondary-fixed-dim transition-colors duration-200 hover:text-tertiary-fixed-dim"
          >
            Contact
          </a>
        </nav>
        <p className="text-center text-sm font-light text-secondary-fixed-dim md:text-left">
          © {copyrightYear} AstroLink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}