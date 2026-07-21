import type { ReactNode } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
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
    <header className="mb-8 flex w-full flex-col items-center px-1">
      <Link
        href="/"
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_4px_20px_rgba(0,88,188,0.18)]"
        aria-label="AstroLink home"
      >
        <MaterialIcon name="rocket_launch" className="text-on-primary" size={28} />
      </Link>
      <p className="activate-eyebrow mb-3">Expert setup</p>
      {/* Explicit block stack — never max-w-md/lg (spacing token collision). */}
      <h1 className="activate-title">{title}</h1>
      {subtitle ? <p className="activate-subtitle">{subtitle}</p> : null}
    </header>
  );
}

/** Chris-style skewed segments on white (primary fill). */
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
      className="mb-6 flex w-full flex-col items-center gap-3"
      aria-label={`Step ${safe + 1} of ${totalSteps}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-on-surface-variant/70">
        Progress
      </span>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => {
          const filled = i <= safe;
          return (
            <div
              key={STEP_LABELS[i] ?? i}
              className={
                filled
                  ? 'activate-segment activate-segment-filled'
                  : 'activate-segment activate-segment-empty'
              }
            />
          );
        })}
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-widest text-on-surface">
        {STEP_LABELS[safe] ?? `Step ${safe + 1}`}
        <span className="font-normal text-on-surface-variant">
          {' '}
          · {safe + 1}/{totalSteps}
        </span>
      </p>
    </div>
  );
}

export function ActivatePageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="activate-flow flex flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="activate-form-max flex w-full flex-col">{children}</div>
    </div>
  );
}

export function ActivateCard({ children }: { children: ReactNode }) {
  return <div className="activate-card">{children}</div>;
}

export const activateInputClass = 'activate-input';
export const activatePrimaryBtnClass = 'activate-btn-primary';
export const activateSecondaryBtnClass = 'activate-btn-secondary';
