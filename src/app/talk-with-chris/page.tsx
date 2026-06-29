import type { Metadata } from 'next';
import Link from 'next/link';
import { getChrisMentorSlug, isChrisBookingEnabled } from '@/lib/chris-campaign/chris-campaign-config';

export const metadata: Metadata = {
  title: 'Talk with Chris Sembroski | AstroLink',
  description:
    'Book a limited live session with Inspiration4 astronaut and space engineer Chris Sembroski.',
  robots: { index: false, follow: false },
};

export default function TalkWithChrisPage() {
  const bookingEnabled = isChrisBookingEnabled();
  const mentorSlug = getChrisMentorSlug();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">AstroLink</p>
      <h1 className="text-3xl font-semibold tracking-tight">Talk with Chris Sembroski</h1>
      <p className="text-lg text-muted-foreground">
        Limited live sessions with Inspiration4 astronaut Chris Sembroski. Full campaign landing
        ships in PR2; booking UI ships in PR3.
      </p>
      {bookingEnabled ? (
        <Link
          href={`/booking?mentor=${encodeURIComponent(mentorSlug)}&campaign=chris`}
          className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Book a session
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">
          Booking is not open yet. Join the waitlist on the homepage.
        </p>
      )}
    </main>
  );
}