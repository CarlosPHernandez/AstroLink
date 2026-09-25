import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('meta-capi', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789012345';
    process.env.META_CAPI_ACCESS_TOKEN = 'EAAG-test-token-that-is-long-enough';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ events_received: 1 }),
      }),
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load() {
    return import('./meta-capi');
  }

  it('hashes email the way Meta requires (trim, lowercase, sha256)', async () => {
    const { hashMetaCapiValue } = await load();
    expect(hashMetaCapiValue('  Test@Example.COM ')).toBe(
      hashMetaCapiValue('test@example.com'),
    );
    expect(hashMetaCapiValue('test@example.com')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('omits empty phone instead of sending null', async () => {
    const { buildMetaCapiUserData } = await load();
    expect(buildMetaCapiUserData({ email: 'buyer@astrolink.ai' }).ph).toBeUndefined();
    expect(buildMetaCapiUserData({ email: 'buyer@astrolink.ai', phone: null }).ph).toBeUndefined();
    const withPhone = buildMetaCapiUserData({ email: 'buyer@astrolink.ai', phone: '+1 (555) 123-4567' });
    expect(withPhone.ph).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
  });

  it('builds a Purchase payload with event_id, USD value, and original_event_data', async () => {
    const { buildMetaCapiPurchasePayload } = await load();
    const payload = buildMetaCapiPurchasePayload({
      bookingId: 'bk-paid',
      amountCents: 14252,
      eventTime: 1789663111,
      email: 'buyer@astrolink.ai',
    });
    expect(payload.data).toHaveLength(1);
    const event = payload.data[0];
    expect(event.event_name).toBe('Purchase');
    expect(event.event_time).toBe(1789663111);
    expect(event.event_id).toBe('bk-paid');
    expect(event.action_source).toBe('website');
    expect(event.custom_data).toEqual({ currency: 'USD', value: 142.52 });
    expect(event.original_event_data).toEqual({
      event_name: 'Purchase',
      event_time: 1789663111,
    });
    expect(event.user_data.em).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(event.user_data.ph).toBeUndefined();
    expect(payload).not.toHaveProperty('attribution_data');
  });

  it('does not POST when the access token is missing', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const { sendMetaCapiPurchase } = await load();
    await expect(
      sendMetaCapiPurchase({
        bookingId: 'bk-1',
        amountCents: 5000,
        email: 'buyer@astrolink.ai',
      }),
    ).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('POSTs Purchase to Graph /{pixel}/events with the access token', async () => {
    const { sendMetaCapiPurchase } = await load();
    await expect(
      sendMetaCapiPurchase({
        bookingId: 'bk-paid',
        amountCents: 7500,
        email: 'buyer@astrolink.ai',
      }),
    ).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('https://graph.facebook.com/v25.0/123456789012345/events');
    expect(String(url)).toContain('access_token=');
    expect(init).toMatchObject({ method: 'POST' });
    const body = JSON.parse(String(init && 'body' in init ? init.body : '{}')) as {
      data: Array<{ event_name: string; event_id: string }>;
    };
    expect(body.data[0]).toMatchObject({
      event_name: 'Purchase',
      event_id: 'bk-paid',
    });
  });

  it('skips Purchase when amount is not a paid booking', async () => {
    const { sendMetaCapiPurchase } = await load();
    await expect(
      sendMetaCapiPurchase({
        bookingId: 'bk-free',
        amountCents: 0,
        email: 'buyer@astrolink.ai',
      }),
    ).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
