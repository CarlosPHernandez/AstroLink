import React from 'react';
import { redirect } from 'next/navigation';

import { ActivateSetupClient } from '@/app/activate/setup/activate-setup-client';
import { getMentorActivationRow } from '@/lib/mentor-activation/claim';
import { requireRole } from '@/lib/require-session';

export default async function ActivateSetupPage() {
  const session = await requireRole('mentor');

  const row = await getMentorActivationRow(session.userId);
  if (!row) {
    redirect('/auth');
  }

  if (row.activation_status === 'active') {
    redirect('/dashboard/mentor');
  }

  return (
    <ActivateSetupClient
      session={{
        userId: session.userId,
        email: session.email,
        fullName: session.fullName,
      }}
      profile={{
        fullName: row.full_name,
        email: row.email,
        title: row.title ?? '',
        employer: row.employer,
        expertise: row.expertise.join(', '),
        bio: row.bio,
        rate: Math.round(row.live_session_price_cents / 100),
        payoutMethod: row.payout_method,
        payoutHandle: row.payout_handle ?? '',
      }}
    />
  );
}
