import React from 'react';
import { listMentorBookings } from '@/lib/mentor-bookings';
import { requireRole } from '@/lib/require-session';
import { supabaseAdmin } from '@/lib/supabase';
import MentorDashboardClient from './mentor-dashboard-client';

export default async function MentorDashboard() {
  const session = await requireRole('mentor');

  const [bookings, mentorRow] = await Promise.all([
    listMentorBookings(session.userId),
    supabaseAdmin
      .from('mentors')
      .select(
        'full_name, email, employer, expertise, bio, live_session_price_cents, compliance_status, stripe_onboarding_completed, is_civil_servant',
      )
      .eq('id', session.userId)
      .maybeSingle(),
  ]);

  const mentor = mentorRow.data;

  return (
    <MentorDashboardClient
      session={session}
      bookings={bookings}
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
              isCivilServant: mentor.is_civil_servant,
            }
          : null
      }
    />
  );
}
