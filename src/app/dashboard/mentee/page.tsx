import React, { Suspense } from 'react';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { listMenteeBookings } from '@/lib/mentee-bookings';
import { requireSession } from '@/lib/require-session';
import MenteeDashboardClient from './mentee-dashboard-client';

async function MenteeDashboardContent() {
  const session = await requireSession();

  const bookings = await listMenteeBookings(session.userId);

  return (
    <MenteeDashboardClient
      session={session}
      bookings={bookings}
      skipPayments={isStripePaymentsSkipped()}
    />
  );
}

export default function MenteeDashboard() {
  return (
    <Suspense fallback={null}>
      <MenteeDashboardContent />
    </Suspense>
  );
}
