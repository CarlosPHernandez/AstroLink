import React from 'react';
import { ActivateClaimClient } from '@/app/activate/activate-claim-client';
import {
  ActivateBrandHeader,
  ActivateCard,
  ActivatePageFrame,
} from '@/components/activate/activate-shell';
import { loadValidClaimToken, MentorClaimError } from '@/lib/mentor-activation/claim';
import { supabaseAdmin } from '@/lib/supabase';

type SearchParams = Promise<{ token?: string }>;

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawToken = params.token?.trim() ?? '';

  if (!rawToken) {
    return (
      <ActivatePageFrame>
        <ActivateBrandHeader
          title="Activation link required"
          subtitle="Open the invite email we sent you and use Activate your account."
        />
        <ActivateCard>
          <p className="text-center text-sm leading-relaxed text-on-surface-variant text-pretty">
            If you need a new link, contact AstroLink support or your ops contact.
          </p>
        </ActivateCard>
      </ActivatePageFrame>
    );
  }

  try {
    const token = await loadValidClaimToken(rawToken);
    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', token.mentor_id)
      .maybeSingle();

    return (
      <ActivatePageFrame>
        <ActivateBrandHeader
          title="Activate your expert account"
          subtitle="One secure step to claim your profile and open your dashboard."
        />
        <ActivateCard>
          <ActivateClaimClient
            token={rawToken}
            expertName={mentor?.full_name ?? 'Expert'}
            email={token.email}
            expiresAt={token.expires_at}
          />
        </ActivateCard>
      </ActivatePageFrame>
    );
  } catch (err: unknown) {
    const message =
      err instanceof MentorClaimError
        ? err.message
        : 'This activation link is not valid.';
    return (
      <ActivatePageFrame>
        <ActivateBrandHeader
          title="Link unavailable"
          subtitle="This invite cannot be used. Request a new one from AstroLink ops."
        />
        <ActivateCard>
          <p className="mb-2 text-center text-base font-medium text-on-surface text-pretty">
            {message}
          </p>
          <p className="text-center text-xs uppercase tracking-widest text-on-surface-variant">
            Links expire and can only be used once
          </p>
        </ActivateCard>
      </ActivatePageFrame>
    );
  }
}
