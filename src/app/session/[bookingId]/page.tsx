import { redirect } from 'next/navigation';
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { getBookingForSession } from '@/lib/booking-access';
import { getDashboardPathForRole } from '@/lib/dashboard-paths';
import { getSession } from '@/lib/session';
import SessionRoomClient from './session-room-client';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { booking, forbidden } = await getBookingForSession(bookingId);

  if (forbidden) {
    redirect(toAuthWithRedirect(`/session/${bookingId}`));
  }

  if (!booking) {
    const session = await getSession();
    redirect(getDashboardPathForRole(session?.role ?? 'mentee'));
  }

  return <SessionRoomClient booking={booking} />;
}
