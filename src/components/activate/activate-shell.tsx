import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '@/components/activate/activate-flow.css';

const STEP_LABELS = ['Welcome', 'Identity', 'Profile', 'Payouts', 'Done'] as const;

export function ActivateBrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10 flex w-full flex-col items-center">
      <Link href="/" className="mb-8" aria-label="AstroLink home">
        <Image
          src="/logo.jpg"
          alt="AstroLink"
          width={220}
          height={60}
          className="activate-logo"
          priority
        />
      </Link>
      {/* Block stack only — no max-w-md/lg (spacing token collision). */}
      <h1 className="activate-title">{title}</h1>
      {subtitle ? <p className="activate-subtitle">{subtitle}</p> : null}
    </header>
  );
}

/** Chris-style skewed segmented progress bar. */
export function ActivateStepProgress({
  currentStep,
  totalSteps = 5,
}: {
  currentStep: number;
  totalSteps?: number;
}) {
  const safe = Math.min(Math.max(currentStep, 0), totalSteps - 1);
  return (
    <div
      className="mb-10 flex w-full flex-col items-center"
      aria-label={`Step ${safe + 1} of ${totalSteps}: ${STEP_LABELS[safe] ?? ''}`}
    >
      <div className="activate-segments" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={STEP_LABELS[i] ?? i}
            className={
              i <= safe
                ? 'activate-segment activate-segment-filled'
                : 'activate-segment activate-segment-empty'
            }
          />
        ))}
      </div>
      <p className="activate-step-caption">
        {STEP_LABELS[safe]} · {safe + 1} of {totalSteps}
      </p>
    </div>
  );
}

export function ActivatePageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="activate-flow flex flex-col items-center justify-center px-6 py-12 sm:px-8 sm:py-16">
      <div className="activate-form-max flex w-full flex-col">{children}</div>
    </div>
  );
}

/** Content region without a heavy card chrome. */
export function ActivateCard({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

export const activateInputClass = 'activate-input';
export const activatePrimaryBtnClass = 'activate-btn-primary';
export const activateSecondaryBtnClass = 'activate-btn-secondary';
