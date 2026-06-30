import Link from 'next/link';

type ChrisLandingFooterProps = {
  copyrightYear: number;
};

export function ChrisLandingFooter({ copyrightYear }: ChrisLandingFooterProps) {
  return (
    <footer className="mt-auto border-t border-outline-variant/10 bg-primary-container">
      <div className="chris-fade-in-up chris-delay-500 mx-auto flex w-full max-w-[80rem] flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row md:px-12">
        <div className="text-lg font-bold tracking-tight text-white">
          <span className="text-tertiary-fixed-dim">Astro</span>Link
        </div>
        <div className="flex space-x-8">
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
        </div>
        <p className="text-sm font-light text-secondary-fixed-dim">
          © {copyrightYear} AstroLink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}