import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { getMenteeProfile } from '@/lib/user-profile';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import MenteeSettingsClient from './mentee-settings-client';

export default async function MenteeSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  if (session.role !== 'mentee') {
    redirect(session.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/admin');
  }

  const profile = await getMenteeProfile(session.userId);

  return (
    <MenteeSettingsClient
      session={{
        userId: session.userId,
        email: session.email,
        role: 'mentee',
        fullName: session.fullName,
      }}
      profile={
        profile ?? {
          id: session.userId,
          email: session.email,
          fullName: session.fullName,
          phone: null,
          bio: '',
          stripeCustomerId: null,
          preferredLocale: 'en',
        }
      }
      skipPayments={isStripePaymentsSkipped()}
    />
  );
}
