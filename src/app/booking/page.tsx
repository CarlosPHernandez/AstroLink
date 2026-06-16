import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { getMentorBySlug, listPublicMentors } from '@/lib/mentor-directory';
import { requireSession } from '@/lib/require-session';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const session = await requireSession();

  const { mentor: mentorSlug } = await searchParams;
  const [experts, mentor] = await Promise.all([
    listPublicMentors(),
    mentorSlug ? getMentorBySlug(mentorSlug) : Promise.resolve(null),
  ]);
  const invalidMentorSlug = mentorSlug && !mentor ? mentorSlug : null;

  return (
    <BookingClient
      session={session}
      experts={experts}
      mentor={mentor}
      invalidMentorSlug={invalidMentorSlug}
      skipPayments={isStripePaymentsSkipped()}
    />
  );
}
