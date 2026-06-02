import 'server-only';

import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { stripe } from '@/lib/stripe';
import {
  getMenteeProfile,
  setMenteeStripeCustomerId,
} from '@/lib/user-profile';

function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Returns an existing Stripe Customer id or creates one and persists it on `users`.
 */
export async function getOrCreateStripeCustomerForMentee(
  userId: string,
): Promise<string | null> {
  if (isStripePaymentsSkipped()) {
    return null;
  }

  const profile = await getMenteeProfile(userId);
  if (!profile) {
    throw new Error('Mentee profile not found.');
  }

  if (profile.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.fullName,
    metadata: { astrolink_user_id: userId },
  });

  await setMenteeStripeCustomerId(userId, customer.id);
  return customer.id;
}

export async function createMenteeBillingPortalSession(
  userId: string,
): Promise<string> {
  const customerId = await getOrCreateStripeCustomerForMentee(userId);
  if (!customerId) {
    throw new Error('Stripe billing is disabled in this environment.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appBaseUrl()}/dashboard/mentee/settings`,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a billing portal URL.');
  }

  return session.url;
}
