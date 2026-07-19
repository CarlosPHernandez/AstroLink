import { createHash } from 'crypto';

/** One-way IP fingerprint for analytics — never store raw IP. */
export function hashClientIp(ip: string): string {
  const salt = process.env.LANDING_RELAY_IP_HASH_SALT?.trim() || process.env.ENCRYPTION_KEY?.trim() || 'astrolink-landing';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
