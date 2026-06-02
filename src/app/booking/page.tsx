import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { requireSession } from '@/lib/require-session';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const session = await requireSession();

  const { mentor: mentorSlug } = await searchParams;
  const mentor = mentorSlug ? await getMentorBySlug(mentorSlug) : null;

  return <BookingClient session={session} mentor={mentor} skipPayments={isStripePaymentsSkipped()} />;
}
