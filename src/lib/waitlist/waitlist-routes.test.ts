import { describe, expect, it } from 'vitest';
import { resolveWaitlistRoute } from '@/lib/waitlist/waitlist-routes';

describe('resolveWaitlistRoute', () => {
  it('redirects home to early access', () => {
    expect(resolveWaitlistRoute('/', null)).toEqual({
      action: 'redirect',
      destination: '/early-access',
    });
  });

  it('allows public waitlist pages', () => {
    expect(resolveWaitlistRoute('/early-access', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/early-access/player', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/privacy', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/join/david-guajardo', null)).toEqual({ action: 'allow' });
  });

  it('redirects marketing and app surfaces', () => {
    for (const path of ['/experts', '/experts/chris-sembroski', '/booking', '/auth', '/dashboard/mentee']) {
      expect(resolveWaitlistRoute(path, null)).toEqual({
        action: 'redirect',
        destination: '/early-access',
      });
    }
  });

  it('allows admin dashboard only for admin sessions', () => {
    expect(resolveWaitlistRoute('/dashboard/admin', null)).toEqual({
      action: 'redirect',
      destination: '/early-access',
    });
    expect(resolveWaitlistRoute('/dashboard/admin', { role: 'mentee' })).toEqual({
      action: 'redirect',
      destination: '/early-access',
    });
    expect(resolveWaitlistRoute('/dashboard/admin', { role: 'admin' })).toEqual({
      action: 'allow',
    });
  });

  it('allows signup and webhook APIs only', () => {
    expect(resolveWaitlistRoute('/api/early-access', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/admin/metrics', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/webhooks/stripe', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/book', null)).toEqual({ action: 'api_blocked' });
    expect(resolveWaitlistRoute('/api/auth/session', null)).toEqual({ action: 'api_blocked' });
  });
});