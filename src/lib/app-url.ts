import 'server-only';

const PRODUCTION_APP_URL = 'https://astro-link.space';

/** Canonical app origin for auth redirects and Stripe return URLs. */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://127.0.0.1:3000';
}

export function getProductionAppUrl(): string {
  return PRODUCTION_APP_URL;
}

export function appAuthPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalized}`;
}