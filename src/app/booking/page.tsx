import { redirect } from 'next/navigation';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/auth');
  }

  const { mentor: mentorSlug } = await searchParams;
  const mentor = mentorSlug ? await getMentorBySlug(mentorSlug) : null;

  return <BookingClient session={session} mentor={mentor} skipPayments={isStripePaymentsSkipped()} />;
}
