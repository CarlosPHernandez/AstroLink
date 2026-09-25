/**
 * Meta Conversions API (server events) for paid-traffic campaigns.
 * POST https://graph.facebook.com/{version}/{PIXEL_ID}/events?access_token=...
 * Dedupes with the browser pixel via event_id = booking id.
 * Never send raw email/phone — SHA-256 only. Never send ph: [null].
 */

import { createHash } from 'crypto';
import { centsToMetaPixelValue, getMetaPixelId } from '@/lib/meta-pixel';

const GRAPH_VERSION = 'v25.0';

export type MetaCapiEventName = 'InitiateCheckout' | 'Purchase';

export type MetaCapiUserData = {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

export type MetaCapiServerEvent = {
  event_name: MetaCapiEventName;
  event_time: number;
  event_id: string;
  action_source: 'website';
  event_source_url: string;
  user_data: MetaCapiUserData;
  custom_data: {
    currency: 'USD';
    value: number;
  };
  original_event_data: {
    event_name: MetaCapiEventName;
    event_time: number;
  };
};

export type MetaCapiPayload = {
  data: MetaCapiServerEvent[];
  test_event_code?: string;
};

export function hashMetaCapiValue(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function getMetaCapiAccessToken(): string | null {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim() ?? '';
  return token.length >= 20 ? token : null;
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(getMetaPixelId() && getMetaCapiAccessToken());
}

function normalizePhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

export function buildMetaCapiUserData(opts: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): MetaCapiUserData {
  const userData: MetaCapiUserData = {};
  const email = opts.email?.trim().toLowerCase();
  if (email && email.includes('@')) {
    userData.em = [hashMetaCapiValue(email)];
  }
  const phoneDigits = opts.phone ? normalizePhoneDigits(opts.phone) : null;
  if (phoneDigits) {
    userData.ph = [hashMetaCapiValue(phoneDigits)];
  }
  if (opts.externalId?.trim()) {
    userData.external_id = [hashMetaCapiValue(opts.externalId.trim())];
  }
  if (opts.clientIp && opts.clientIp !== '127.0.0.1' && opts.clientIp !== '::1') {
    userData.client_ip_address = opts.clientIp;
  }
  if (opts.clientUserAgent?.trim()) {
    userData.client_user_agent = opts.clientUserAgent.trim();
  }
  if (opts.fbp?.trim()) {
    userData.fbp = opts.fbp.trim();
  }
  if (opts.fbc?.trim()) {
    userData.fbc = opts.fbc.trim();
  }
  return userData;
}

export function defaultMetaCapiEventSourceUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = (configured || 'https://astro-link.space').replace(/\/$/, '');
  return `${base}/booking`;
}

export function readMetaBrowserIds(request: Request): { fbp?: string; fbc?: string } {
  const cookie = request.headers.get('cookie') ?? '';
  const fbp = cookie.match(/(?:^|;\s*)_fbp=([^;]+)/i)?.[1];
  const fbc = cookie.match(/(?:^|;\s*)_fbc=([^;]+)/i)?.[1];
  return {
    ...(fbp ? { fbp: decodeURIComponent(fbp) } : {}),
    ...(fbc ? { fbc: decodeURIComponent(fbc) } : {}),
  };
}

export function readClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || undefined;
  if (!ip || ip === '127.0.0.1' || ip === '::1') return undefined;
  return ip;
}

function buildEvent(opts: {
  eventName: MetaCapiEventName;
  bookingId: string;
  amountCents: number;
  eventTime?: number;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  eventSourceUrl?: string;
}): MetaCapiServerEvent {
  const eventTime = opts.eventTime ?? Math.floor(Date.now() / 1000);
  return {
    event_name: opts.eventName,
    event_time: eventTime,
    event_id: opts.bookingId,
    action_source: 'website',
    event_source_url: opts.eventSourceUrl ?? defaultMetaCapiEventSourceUrl(),
    user_data: buildMetaCapiUserData(opts),
    custom_data: {
      currency: 'USD',
      value: centsToMetaPixelValue(opts.amountCents),
    },
    original_event_data: {
      event_name: opts.eventName,
      event_time: eventTime,
    },
  };
}

export function buildMetaCapiPurchasePayload(opts: {
  bookingId: string;
  amountCents: number;
  eventTime?: number;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  eventSourceUrl?: string;
}): MetaCapiPayload {
  return {
    data: [buildEvent({ ...opts, eventName: 'Purchase' })],
  };
}

async function postMetaCapiPayload(payload: MetaCapiPayload): Promise<boolean> {
  const pixelId = getMetaPixelId();
  const token = getMetaCapiAccessToken();
  if (!pixelId || !token) return false;

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const body: MetaCapiPayload = testCode ? { ...payload, test_event_code: testCode } : payload;

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[meta-capi] Graph error', res.status, text.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[meta-capi] request failed', err);
    return false;
  }
}

export async function sendMetaCapiInitiateCheckout(opts: {
  bookingId: string;
  amountCents: number;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): Promise<boolean> {
  if (!opts.bookingId || !Number.isFinite(opts.amountCents) || opts.amountCents <= 0) {
    return false;
  }
  return postMetaCapiPayload({
    data: [buildEvent({ ...opts, eventName: 'InitiateCheckout' })],
  });
}

export async function sendMetaCapiPurchase(opts: {
  bookingId: string;
  amountCents: number;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  eventTime?: number;
}): Promise<boolean> {
  if (!opts.bookingId || !Number.isFinite(opts.amountCents) || opts.amountCents <= 0) {
    return false;
  }
  return postMetaCapiPayload(buildMetaCapiPurchasePayload(opts));
}
