import { redirect } from 'next/navigation';
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { getBookingForSession } from '@/lib/booking-access';
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
    redirect('/dashboard/mentee');
  }

  return <SessionRoomClient booking={booking} />;
}
