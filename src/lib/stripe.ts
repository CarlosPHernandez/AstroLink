import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      // Use a stable API version for PaymentIntent + Payment Element behavior.
      // We cast because the package's types are locked to its own declared
      // version literal (currently '2026-05-27.dahlia').
      apiVersion: '2024-06-20' as any,
    });
  }
  return stripeClient;
}

/** Lazy Stripe client — avoids throwing during `next build` when env is absent. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
