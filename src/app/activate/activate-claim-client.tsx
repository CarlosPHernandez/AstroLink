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
      <div className="rounded-xl border border-outline-variant/80 bg-surface-container-low/70 p-4 sm:p-5">
        <p className="text-center text-base leading-relaxed text-on-surface text-pretty sm:text-left">
          Hi <span className="font-semibold">{expertName}</span>
          {' — '}
          we already prepared your expert profile. Confirm sign-in, then review your details.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="activate-meta-chip">
            <dt>Sign-in email</dt>
            <dd>{email}</dd>
          </div>
          <div className="activate-meta-chip">
            <dt>Link expires</dt>
            <dd>{expiresLabel}</dd>
          </div>
        </dl>
      </div>

      {state?.message ? <FormAlert message={state.message} /> : null}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className={activatePrimaryBtnClass}
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
        <p className="text-center text-xs uppercase tracking-widest text-on-surface-variant/80">
          Stay on AstroLink · no password for this invite
        </p>
      </form>
    </div>
  );
}
