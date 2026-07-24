import React from 'react';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { listMenteeBookings } from '@/lib/mentee-bookings';
import { getAvailableGrantForUser } from '@/lib/session-comp-grants';
import { requireSession } from '@/lib/require-session';
import MenteeDashboardClient from './mentee-dashboard-client';

export default async function MenteeDashboard() {
  const session = await requireSession();
  const [bookings, compGrant] = await Promise.all([
    listMenteeBookings(session.userId),
    getAvailableGrantForUser(session.userId).catch(() => null),
  ]);

  return (
    <MenteeDashboardClient
      session={session}
      bookings={bookings}
      skipPayments={isStripePaymentsSkipped()}
      compGrant={
        compGrant
          ? {
              id: compGrant.id,
              creditMinutes: compGrant.creditMinutes,
              expiresAt: compGrant.expiresAt,
            }
          : null
      }
    />
  );
}
