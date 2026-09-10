import { describe, expect, it } from 'vitest';
import { resolveWaitlistRoute } from '@/lib/waitlist/waitlist-routes';

describe('resolveWaitlistRoute', () => {
  it('redirects home and retired early-access paths to talk-with-chris', () => {
    expect(resolveWaitlistRoute('/', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/early-access', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/early-access/player', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
  });

  it('redirects partner join landings to talk-with-chris', () => {
    expect(resolveWaitlistRoute('/join/david-guajardo', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
  });

  it('allows remaining public waitlist pages', () => {
    expect(resolveWaitlistRoute('/talk-with-chris', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/press', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/privacy', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/experts', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/experts/chris-sembroski', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/sitemap.xml', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/robots.txt', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/assessment', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/assessment/results/abc', null)).toEqual({ action: 'allow' });
  });

  it('redirects protected app surfaces', () => {
    for (const path of ['/booking', '/auth', '/dashboard/mentee']) {
      expect(resolveWaitlistRoute(path, null)).toEqual({
        action: 'redirect',
        destination: '/talk-with-chris',
      });
    }
  });

  it('allows admin dashboard only for admin sessions', () => {
    expect(resolveWaitlistRoute('/dashboard/admin', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/dashboard/admin', { role: 'mentee' })).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/dashboard/admin', { role: 'admin' })).toEqual({
      action: 'allow',
    });
  });

  it('allows signup and webhook APIs only', () => {
    expect(resolveWaitlistRoute('/api/early-access', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/path-assessment', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/path-assessment/tok', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/admin/metrics', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/webhooks/stripe', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/webhooks/stripe/', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/webhooks/daily/', null)).toEqual({ action: 'allow' });
    expect(resolveWaitlistRoute('/api/book', null)).toEqual({ action: 'api_blocked' });
    expect(resolveWaitlistRoute('/api/auth/session', null)).toEqual({ action: 'api_blocked' });
  });

  it('does not reopen Chris booking APIs or pages (waitlist experiment retired)', () => {
    expect(resolveWaitlistRoute('/auth', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/booking', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
    expect(resolveWaitlistRoute('/api/book', null)).toEqual({ action: 'api_blocked' });
    expect(resolveWaitlistRoute('/api/auth/session', null)).toEqual({ action: 'api_blocked' });
    expect(resolveWaitlistRoute('/api/chris-slot-choice', null)).toEqual({
      action: 'api_blocked',
    });
    expect(resolveWaitlistRoute('/r/chris-slot', null)).toEqual({
      action: 'redirect',
      destination: '/talk-with-chris',
    });
  });
});