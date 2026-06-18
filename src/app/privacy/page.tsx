import type { Metadata } from 'next';
import Link from 'next/link';
import { PrivacyPolicyDocument } from '@/components/legal/privacy-policy-document';
import { isWaitlistMode } from '@/lib/app-mode';

export const metadata: Metadata = {
  title: 'Privacy Policy | AstroLink',
  description: 'How AstroLink collects, uses, and protects your personal information.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const backHref = isWaitlistMode() ? '/early-access' : '/';

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <header>
        <div className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg h-12 sm:h-14 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm font-medium text-on-surface hover:opacity-60 transition-opacity"
          >
            AstroLink
          </Link>
          <Link
            href={backHref}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-[var(--max-width-prose)] mx-auto px-md sm:px-lg pt-8 sm:pt-12 pb-16 sm:pb-24">
        <PrivacyPolicyDocument />
      </main>

      <footer className="pb-8">
        <div className="max-w-[var(--spacing-container-max)] mx-auto px-md sm:px-lg flex justify-center text-xs text-on-surface-variant/70">
          <span>© {new Date().getFullYear()} AstroLink</span>
        </div>
      </footer>
    </div>
  );
}