/**
 * Meta Pixel (Facebook/Instagram ads) for paid-traffic campaigns.
 * Conversion is a paid live-session booking — not waitlist, assessment, or video requests.
 * Never send email, names, or other PII in event params.
 */

type FbqFn = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void };

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

const PURCHASE_KEY_PREFIX = 'astrolink-meta-purchase:';
const CHECKOUT_KEY_PREFIX = 'astrolink-meta-checkout:';

export function getMetaPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? '';
  return /^\d{8,20}$/.test(id) ? id : null;
}

export function centsToMetaPixelValue(amountCents: number): number {
  return Math.round(amountCents) / 100;
}

function getFbq(): FbqFn | null {
  if (typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? window.fbq : null;
}

function storageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage must not break checkout.
  }
}

export function rememberMetaCheckout(bookingId: string, amountCents: number): void {
  if (!bookingId || !Number.isFinite(amountCents) || amountCents <= 0) return;
  storageSet(`${CHECKOUT_KEY_PREFIX}${bookingId}`, String(Math.round(amountCents)));
}

export function trackMetaPageView(): void {
  if (!getMetaPixelId()) return;
  getFbq()?.('track', 'PageView');
}

export function trackMetaInitiateCheckout(opts: { bookingId: string; amountCents: number }): boolean {
  if (!getMetaPixelId()) return false;
  if (!opts.bookingId || !Number.isFinite(opts.amountCents) || opts.amountCents <= 0) return false;
  rememberMetaCheckout(opts.bookingId, opts.amountCents);
  getFbq()?.('track', 'InitiateCheckout', {
    value: centsToMetaPixelValue(opts.amountCents),
    currency: 'USD',
  }, { eventID: opts.bookingId });
  return true;
}

export function trackMetaPurchase(opts: { bookingId: string; amountCents: number }): boolean {
  if (!getMetaPixelId()) return false;
  if (!opts.bookingId || !Number.isFinite(opts.amountCents) || opts.amountCents <= 0) return false;
  const key = `${PURCHASE_KEY_PREFIX}${opts.bookingId}`;
  if (storageGet(key)) return false;
  const fbq = getFbq();
  if (!fbq) return false;
  fbq(
    'track',
    'Purchase',
    { value: centsToMetaPixelValue(opts.amountCents), currency: 'USD' },
    { eventID: opts.bookingId },
  );
  storageSet(key, '1');
  return true;
}

/** After Stripe 3DS redirect to /dashboard/mentee?booked= */
export function trackMetaPurchaseFromRedirect(bookingId: string): boolean {
  if (!bookingId) return false;
  const raw = storageGet(`${CHECKOUT_KEY_PREFIX}${bookingId}`);
  const amountCents = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(amountCents) || amountCents <= 0) return false;
  return trackMetaPurchase({ bookingId, amountCents });
}
