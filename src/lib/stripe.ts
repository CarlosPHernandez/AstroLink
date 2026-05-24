import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set.');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  // Use the API version specified in the design spec or fallback to Stripe SDK defaults
  apiVersion: '2023-10-16' as any,
});
