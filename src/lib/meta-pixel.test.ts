import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const PIXEL_ID = '123456789012345';

describe('meta-pixel', () => {
  const originalEnv = { ...process.env };
  const store = new Map<string, string>();

  beforeEach(() => {
    process.env = { ...originalEnv };
    store.clear();
    vi.stubGlobal('window', {
      fbq: vi.fn(),
    });
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load() {
    return import('./meta-pixel');
  }

  it('ignores a missing or non-numeric pixel id', async () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const { getMetaPixelId } = await load();
    expect(getMetaPixelId()).toBeNull();

    vi.resetModules();
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '  not-a-pixel  ';
    const again = await import('./meta-pixel');
    expect(again.getMetaPixelId()).toBeNull();
  });

  it('accepts a numeric pixel id', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
    const { getMetaPixelId } = await load();
    expect(getMetaPixelId()).toBe(PIXEL_ID);
  });

  it('converts cents to a Meta Purchase value', async () => {
    const { centsToMetaPixelValue } = await load();
    expect(centsToMetaPixelValue(5000)).toBe(50);
    expect(centsToMetaPixelValue(1099)).toBe(10.99);
  });

  it('fires InitiateCheckout with the booking id for Conversions API dedup', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
    const { trackMetaInitiateCheckout } = await load();
    expect(trackMetaInitiateCheckout({ bookingId: 'bk-paid', amountCents: 7500 })).toBe(true);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'InitiateCheckout',
      { value: 75, currency: 'USD' },
      { eventID: 'bk-paid' },
    );
  });

  it('does not fire Purchase for free or skip-payment bookings', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
    const { trackMetaPurchase } = await load();
    expect(trackMetaPurchase({ bookingId: 'bk-1', amountCents: 0 })).toBe(false);
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it('fires Purchase once per booking with value, currency, and eventID', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
    const { trackMetaPurchase } = await load();
    expect(trackMetaPurchase({ bookingId: 'bk-paid', amountCents: 7500 })).toBe(true);
    expect(trackMetaPurchase({ bookingId: 'bk-paid', amountCents: 7500 })).toBe(false);
    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      { value: 75, currency: 'USD' },
      { eventID: 'bk-paid' },
    );
  });

  it('remembers checkout value so a Stripe redirect can still convert', async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = PIXEL_ID;
    const { rememberMetaCheckout, trackMetaPurchaseFromRedirect } = await load();
    rememberMetaCheckout('bk-redirect', 18000);
    expect(trackMetaPurchaseFromRedirect('bk-redirect')).toBe(true);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      { value: 180, currency: 'USD' },
      { eventID: 'bk-redirect' },
    );
  });
});
