import { createHash, randomBytes } from 'crypto';

export function generateClaimTokenRaw(): string {
  return randomBytes(32).toString('base64url');
}

export function hashClaimToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function defaultClaimExpiry(hours = 72): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function isClaimExpired(expiresAt: string | Date, now = new Date()): boolean {
  const exp = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return exp.getTime() <= now.getTime();
}
