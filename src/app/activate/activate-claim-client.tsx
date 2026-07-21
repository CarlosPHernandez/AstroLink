'use client';

import { useActionState } from 'react';
import { beginClaimAction, type ActivateActionState } from '@/app/activate/actions';
import { activatePrimaryBtnClass } from '@/components/activate/activate-shell';
import { FormAlert } from '@/components/forms/form-alert';
import { MaterialIcon } from '@/components/ui/material-icon';

export function ActivateClaimClient({
  token,
  expertName,
  email,
  expiresAt,
}: {
  token: string;
  expertName: string;
  email: string;
  expiresAt: string;
}) {
  const [state, formAction, pending] = useActionState<
    ActivateActionState | undefined,
    FormData
  >(beginClaimAction, undefined);

  const expiresLabel = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low/60 p-4 sm:p-5">
        <p className="font-body-md text-body-md text-on-surface text-center sm:text-left">
          Hi{' '}
          <span className="font-semibold text-on-surface">{expertName}</span>
          — we already prepared your expert profile. Confirm sign-in and review your details next.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5">
            <dt className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-0.5">
              Sign-in email
            </dt>
            <dd className="font-body-md text-sm text-on-surface break-all">{email}</dd>
          </div>
          <div className="rounded-md border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5">
            <dt className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-0.5">
              Link expires
            </dt>
            <dd className="font-body-md text-sm text-on-surface">{expiresLabel}</dd>
          </div>
        </dl>
      </div>

      {state?.message ? <FormAlert message={state.message} /> : null}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className={`${activatePrimaryBtnClass} w-full gap-2`}
          data-testid="activate-begin-claim"
        >
          {pending ? (
            'Starting secure sign-in…'
          ) : (
            <>
              Continue securely
              <MaterialIcon name="arrow_forward" size={18} className="text-on-primary" />
            </>
          )}
        </button>
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          You&apos;ll stay on AstroLink — no password required for this invite.
        </p>
      </form>
    </div>
  );
}
