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

export function LandingAuthNavClient() {
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
        <span className="text-sm text-on-surface-variant font-medium hidden sm:inline">
          Welcome, {session.fullName.split(' ')[0]}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </form>
        <Link
          href={dashboardPath(session.role)}
          className="bg-primary text-on-primary px-3 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm"
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
        className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth"
        className="bg-primary text-on-primary px-3.5 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm"
      >
        Launch Mission
      </Link>
    </div>
  );
}
