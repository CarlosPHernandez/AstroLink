import Link from 'next/link';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[color:var(--landing-canvas)]/85 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 sm:h-16 flex justify-between items-center">
        <Link
          href="/"
          className="font-landing-wordmark text-base sm:text-lg text-[var(--landing-text)] hover:text-[var(--landing-accent)] transition-colors"
        >
          AstroLink
        </Link>
        <nav className="flex items-center gap-3 sm:gap-8 shrink-0">
          <Link
            href="/auth?mode=signup&redirect=%2Fexperts"
            className="text-xs sm:text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)] transition-colors"
          >
            Experts
          </Link>
          <Link
            href="/press"
            className="hidden md:inline text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)] transition-colors"
          >
            Press
          </Link>
          <LandingAuthNavClient theme="light" ctaStyle="pill" />
        </nav>
      </div>
    </header>
  );
}
