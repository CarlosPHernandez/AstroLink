import React from 'react';
import { ActivateClaimClient } from '@/app/activate/activate-claim-client';
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
      <ActivateShell title="Activation link required">
        <p className="text-body-md text-on-surface-variant text-center">
          Open the invite email we sent you and use the Activate button. If you need a new
          link, contact AstroLink support.
        </p>
      </ActivateShell>
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
      <ActivateShell title="Activate your expert account">
        <ActivateClaimClient
          token={rawToken}
          expertName={mentor?.full_name ?? 'Expert'}
          email={token.email}
          expiresAt={token.expires_at}
        />
      </ActivateShell>
    );
  } catch (err: unknown) {
    const message =
      err instanceof MentorClaimError
        ? err.message
        : 'This activation link is not valid.';
    return (
      <ActivateShell title="Link unavailable">
        <p className="text-body-md text-on-surface-variant text-center">{message}</p>
        <p className="text-label-sm text-on-surface-variant text-center mt-4">
          Request a new invite from AstroLink ops if you still need access.
        </p>
      </ActivateShell>
    );
  }
}

function ActivateShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4">
      <main className="w-full max-w-[440px]">
        <h1 className="font-headline-md text-headline-md font-bold text-center mb-2">
          {title}
        </h1>
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl mt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
