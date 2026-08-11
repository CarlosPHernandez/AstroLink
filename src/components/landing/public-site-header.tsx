'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';
import { MaterialIcon } from '@/components/ui/material-icon';

type SessionData = {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
};

const UNLOCK_HREF = '/auth?mode=signup&redirect=%2Fexperts';

const NAV_LINKS = [
  { href: '/experts', label: 'Experts' },
  { href: '/for-educators', label: 'For Educators' },
  { href: '/press', label: 'Press' },
] as const;

function dashboardPath(role: SessionData['role']) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'mentor') return '/dashboard/mentor';
  return '/dashboard/mentee';
}

type PublicSiteHeaderProps = {
  /** Mission landing tokens vs product surfaces (directory, etc.). */
  variant?: 'landing' | 'product';
};

/**
 * Shared public chrome: desktop nav + mobile sheet.
 * Used on the mission landing and the experts directory.
 */
export function PublicSiteHeader({ variant = 'landing' }: PublicSiteHeaderProps) {
  const isLanding = variant === 'landing';
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonId = useId();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { session: SessionData | null }) => {
        if (!cancelled) setSession(data.session);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const shell = isLanding
    ? 'bg-[color:var(--landing-surface)]/85 backdrop-blur-md'
    : 'bg-background/80 backdrop-blur-lg border-b border-outline-variant';

  const wordmark = isLanding
    ? 'font-landing-wordmark text-base sm:text-lg text-[var(--landing-text)] hover:text-[var(--landing-accent)]'
    : 'font-bold text-base sm:text-lg text-on-surface tracking-tight hover:text-primary';

  const mutedLink = isLanding
    ? 'text-[var(--landing-muted)] hover:text-[var(--landing-text)]'
    : 'text-on-surface-variant hover:text-on-surface';

  const navLink = isLanding
    ? 'text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)]'
    : 'text-sm text-on-surface-variant hover:text-on-surface';

  const primaryCta = isLanding
    ? 'rounded-full bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-hover)]'
    : 'rounded-full bg-primary text-on-primary hover:bg-primary-container';

  const menuToggle = isLanding
    ? 'border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-text)] hover:border-[color:color-mix(in_srgb,var(--landing-border)_50%,var(--landing-muted))]'
    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline';

  const panel = isLanding
    ? 'border-[var(--landing-border)] bg-[var(--landing-surface)]'
    : 'border-outline-variant bg-background';

  const panelLink = isLanding
    ? 'border-[var(--landing-border)]/70 text-[var(--landing-text)] hover:text-[var(--landing-accent)]'
    : 'border-outline-variant/70 text-on-surface hover:text-primary';

  const panelMuted = isLanding
    ? 'text-[var(--landing-muted)] hover:text-[var(--landing-text)]'
    : 'text-on-surface-variant hover:text-on-surface';

  const scrim = isLanding
    ? 'bg-[color:var(--landing-ink)]/30'
    : 'bg-on-surface/30';

  const welcome = isLanding ? 'text-[var(--landing-muted)]' : 'text-on-surface-variant';

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className={`md:hidden fixed inset-0 z-40 ${scrim}`}
          onClick={closeMenu}
          data-testid="site-mobile-menu-scrim"
        />
      ) : null}

      <header
        className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] ${shell}`}
        data-testid={isLanding ? 'landing-site-header' : 'product-site-header'}
      >
        <div className="relative mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-md sm:h-16 sm:px-lg">
          <Link
            href="/"
            onClick={closeMenu}
            className={`${wordmark} py-2 -my-2 transition-colors`}
          >
            AstroLink
          </Link>

          <nav className="hidden shrink-0 items-center gap-8 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`${navLink} transition-colors`}>
                {link.label}
              </Link>
            ))}

            {sessionReady && session ? (
              <div className="flex items-center gap-5">
                <span className={`text-sm font-medium ${welcome}`}>
                  Welcome, {session.fullName.split(' ')[0]}
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={`cursor-pointer text-sm transition-colors ${mutedLink}`}
                  >
                    Sign Out
                  </button>
                </form>
                <Link
                  href={dashboardPath(session.role)}
                  className={`inline-flex items-center px-5 py-2.5 text-sm font-medium transition-colors ${primaryCta}`}
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link href="/auth" className={`text-sm transition-colors ${mutedLink}`}>
                  Sign In
                </Link>
                <Link
                  href={UNLOCK_HREF}
                  className={`inline-flex items-center px-5 py-2.5 text-sm font-medium transition-colors ${primaryCta}`}
                >
                  Unlock access
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-1.5 md:hidden">
            {sessionReady && !session ? (
              <Link
                href={UNLOCK_HREF}
                className={`inline-flex min-h-10 touch-manipulation items-center px-3.5 py-2 text-xs font-semibold transition-colors active:scale-[0.98] ${primaryCta}`}
              >
                Join
              </Link>
            ) : null}
            {sessionReady && session ? (
              <Link
                href={dashboardPath(session.role)}
                className={`inline-flex min-h-10 touch-manipulation items-center px-3.5 py-2 text-xs font-semibold transition-colors active:scale-[0.98] ${primaryCta}`}
              >
                Dashboard
              </Link>
            ) : null}
            <button
              type="button"
              id={menuButtonId}
              className={`inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border transition-colors active:scale-[0.98] ${menuToggle}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              data-testid="site-mobile-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MaterialIcon name={menuOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>

        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={menuButtonId}
          data-testid="site-mobile-menu"
          hidden={!menuOpen}
          className={`border-t shadow-[0_24px_48px_-24px_rgba(14,20,32,0.28)] md:hidden ${panel} ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >
          <nav
            className="mx-auto flex max-w-[1200px] flex-col px-md pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`inline-flex min-h-12 touch-manipulation items-center border-b text-base font-medium transition-colors ${panelLink}`}
              >
                {link.label}
              </Link>
            ))}

            {sessionReady && session ? (
              <>
                <Link
                  href={dashboardPath(session.role)}
                  onClick={closeMenu}
                  className={`inline-flex min-h-12 touch-manipulation items-center border-b text-base font-medium transition-colors ${panelLink}`}
                >
                  Dashboard
                </Link>
                <form action={logoutAction} className="mt-1">
                  <button
                    type="submit"
                    className={`inline-flex min-h-12 w-full cursor-pointer touch-manipulation items-center text-left text-base font-medium transition-colors ${panelMuted}`}
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  onClick={closeMenu}
                  className={`inline-flex min-h-12 touch-manipulation items-center border-b text-base font-medium transition-colors ${panelLink}`}
                >
                  Sign In
                </Link>
                <Link
                  href={UNLOCK_HREF}
                  onClick={closeMenu}
                  className={`mt-4 inline-flex min-h-12 touch-manipulation items-center justify-center px-6 text-sm font-semibold transition-colors active:scale-[0.98] ${primaryCta}`}
                >
                  Unlock access
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
