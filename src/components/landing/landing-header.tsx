import Link from 'next/link';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#f7f6f2]/85 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 sm:h-16 flex justify-between items-center">
        <Link
          href="/"
          className="font-landing-wordmark text-base sm:text-lg text-neutral-900 hover:text-[#1a5fd1] transition-colors"
        >
          AstroLink
        </Link>
        <nav className="flex items-center gap-4 sm:gap-8 shrink-0">
          <Link
            href="/experts"
            className="hidden sm:inline text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Experts
          </Link>
          <Link
            href="/press"
            className="hidden md:inline text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Press
          </Link>
          <LandingAuthNavClient theme="light" ctaStyle="pill" />
        </nav>
      </div>
    </header>
  );
}