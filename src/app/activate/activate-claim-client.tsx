'use client';

import { useActionState } from 'react';
import { beginClaimAction, type ActivateActionState } from '@/app/activate/actions';
import { activatePrimaryBtnClass } from '@/components/activate/activate-shell';
import { FormAlert } from '@/components/forms/form-alert';

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
    <div className="flex flex-col gap-10">
      <div className="space-y-4">
        <p className="activate-meta-line">
          Hi <strong>{expertName}</strong>. We already prepared your expert profile. Continue to
          sign in and review your details.
        </p>
        <p className="activate-meta-line">
          Sign-in email: <strong>{email}</strong>
          <br />
          Link expires {expiresLabel}
        </p>
      </div>

      {state?.message ? <FormAlert message={state.message} /> : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className={activatePrimaryBtnClass}
          data-testid="activate-begin-claim"
        >
          {pending ? 'Starting secure sign-in…' : 'Continue'}
        </button>
        <p className="activate-step-caption" style={{ marginTop: 0 }}>
          Secure one-tap sign-in — you&apos;ll set a password in the next steps
        </p>
      </form>
    </div>
  );
}
