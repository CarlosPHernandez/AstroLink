import React from 'react';
import { listMenteeBookings } from '@/lib/mentee-bookings';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MenteeDashboardClient from './mentee-dashboard-client';

export default async function MenteeDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  const bookings = await listMenteeBookings(session.userId);

  return <MenteeDashboardClient session={session} bookings={bookings} />;
}
