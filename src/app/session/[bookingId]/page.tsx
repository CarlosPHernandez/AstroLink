import { redirect } from 'next/navigation';
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
    redirect('/auth');
  }

  if (!booking) {
    redirect('/dashboard/mentee');
  }

  return <SessionRoomClient booking={booking} />;
}
