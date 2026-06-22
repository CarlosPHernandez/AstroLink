import React from 'react';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { isStripeConnectPayoutsEnabled } from '@/lib/mentor-payouts-config';
import { listMentorBookings } from '@/lib/mentor-bookings';
import { listMentorEarnings } from '@/lib/mentor-earnings';
import { requireRole } from '@/lib/require-session';
import { supabaseAdmin } from '@/lib/supabase';
import MentorDashboardClient from './mentor-dashboard-client';

export default async function MentorDashboard() {
  const session = await requireRole('mentor');

  const [bookings, mentorRow, earnings] = await Promise.all([
    listMentorBookings(session.userId),
    supabaseAdmin
      .from('mentors')
      .select(
        'full_name, email, employer, expertise, bio, live_session_price_cents, compliance_status, stripe_onboarding_completed, stripe_connect_account_id, is_civil_servant',
      )
      .eq('id', session.userId)
      .maybeSingle(),
    listMentorEarnings(session.userId),
  ]);

  const mentor = mentorRow.data;

  return (
    <MentorDashboardClient
      session={session}
      bookings={bookings}
      earningsSummary={earnings.summary}
      earningsRows={earnings.rows}
      skipStripePayments={isStripePaymentsSkipped()}
      connectPayoutsEnabled={isStripeConnectPayoutsEnabled()}
      mentorProfile={
        mentor
          ? {
              fullName: mentor.full_name,
              email: mentor.email,
              employer: mentor.employer,
              expertise: mentor.expertise.join(', '),
              bio: mentor.bio,
              rate: Math.round(mentor.live_session_price_cents / 100),
              complianceStatus: mentor.compliance_status,
              stripeOnboardingCompleted: mentor.stripe_onboarding_completed,
              stripeConnectAccountId: mentor.stripe_connect_account_id,
              isCivilServant: mentor.is_civil_servant,
            }
          : null
      }
    />
  );
}
