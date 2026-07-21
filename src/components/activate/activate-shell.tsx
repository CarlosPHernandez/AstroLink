import type { ReactNode } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

const STEP_LABELS = ['Welcome', 'Identity', 'Profile', 'Payouts', 'Done'] as const;

export function ActivateBrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 text-center flex flex-col items-center">
      <Link
        href="/"
        className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-[0_4px_20px_rgba(0,88,188,0.15)]"
        aria-label="AstroLink home"
      >
        <MaterialIcon name="rocket_launch" className="text-on-primary" size={28} />
      </Link>
      <p className="font-label-sm text-label-sm text-primary font-semibold tracking-wide uppercase mb-1">
        Expert setup
      </p>
      <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface mb-xs max-w-lg">
        {title}
      </h1>
      {subtitle ? (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function ActivateStepProgress({
  currentStep,
  totalSteps = 5,
}: {
  currentStep: number;
  totalSteps?: number;
}) {
  const safe = Math.min(Math.max(currentStep, 0), totalSteps - 1);
  return (
    <div className="mb-6" aria-label={`Step ${safe + 1} of ${totalSteps}`}>
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const done = i < safe;
          const active = i === safe;
          return (
            <div key={STEP_LABELS[i] ?? i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={[
                  'h-1.5 w-full rounded-full transition-colors',
                  done || active ? 'bg-primary' : 'bg-surface-container-high',
                ].join(' ')}
              />
              <span
                className={[
                  'hidden sm:block text-[10px] font-mono uppercase tracking-wider truncate max-w-full',
                  active ? 'text-primary font-semibold' : 'text-on-surface-variant',
                ].join(' ')}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sm:hidden text-center text-label-sm text-on-surface-variant">
        Step {safe + 1} of {totalSteps}
        {STEP_LABELS[safe] ? ` · ${STEP_LABELS[safe]}` : ''}
      </p>
    </div>
  );
}

export function ActivatePageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter font-sans selection:bg-primary-container selection:text-on-primary-container">
      <main className="w-full max-w-2xl animate-reveal-up delay-100">{children}</main>
    </div>
  );
}

export function ActivateCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-5 sm:p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
      {children}
    </div>
  );
}

export const activateInputClass =
  'w-full min-h-12 py-2.5 px-3.5 font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow';

export const activatePrimaryBtnClass =
  'inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-95 disabled:opacity-50 transition-opacity';

export const activateSecondaryBtnClass =
  'inline-flex min-h-12 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50 transition-colors';
