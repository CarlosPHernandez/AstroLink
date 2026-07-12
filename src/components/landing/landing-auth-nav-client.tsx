'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logoutAction } from '@/app/auth/actions';

type SessionData = {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
};

function dashboardPath(role: SessionData['role']) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'mentor') return '/dashboard/mentor';
  return '/dashboard/mentee';
}

export function LandingAuthNavClient({
  theme = 'light',
  ctaStyle = 'default',
}: {
  theme?: 'light' | 'dark';
  ctaStyle?: 'default' | 'pill';
}) {
  const isDark = theme === 'dark';
  const isPill = ctaStyle === 'pill' && !isDark;
  const unlockHref = '/auth?mode=signup&redirect=%2Fexperts';
  const muted = isDark
    ? 'text-slate-400 hover:text-white'
    : 'text-[var(--landing-muted)] hover:text-[var(--landing-text)]';
  const cta = isDark
    ? 'bg-blue-500 text-white hover:bg-blue-400 rounded-md'
    : isPill
      ? 'bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent-hover)] rounded-full'
      : 'bg-primary text-on-primary hover:bg-primary-container rounded-md';
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { session: SessionData | null }) => {
        if (!cancelled) setSession(data.session);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (session) {
    return (
      <div className="flex items-center gap-sm sm:gap-lg">
        <span className={`text-sm font-medium hidden sm:inline ${isDark ? 'text-slate-300' : 'text-on-surface-variant'}`}>
          Welcome, {session.fullName.split(' ')[0]}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className={`font-label-md text-xs sm:text-label-md transition-colors cursor-pointer ${muted}`}
          >
            Sign Out
          </button>
        </form>
        <Link
          href={dashboardPath(session.role)}
          className={`px-3 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md active:scale-95 transition-all shadow-sm ${cta}`}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-sm sm:gap-lg">
      <Link
        href="/auth"
        className={`font-label-md text-xs sm:text-label-md transition-colors ${muted}`}
      >
        Sign In
      </Link>
      <Link
        href={isPill ? unlockHref : '/auth'}
        className={`px-3.5 py-2 sm:px-5 sm:py-2.5 font-label-md text-xs sm:text-sm active:scale-95 transition-all ${isPill ? '' : 'shadow-sm'} ${cta}`}
      >
        {isPill ? 'Unlock access' : 'Launch Mission'}
      </Link>
    </div>
  );
}
