import Link from 'next/link';
import { logoutAction } from '@/app/auth/actions';
import { getSession } from '@/lib/session';

function dashboardPath(role: 'mentor' | 'mentee' | 'admin') {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'mentor') return '/dashboard/mentor';
  return '/dashboard/mentee';
}

export function LandingAuthNavFallback() {
  return (
    <div className="flex items-center gap-sm sm:gap-lg">
      <span className="text-on-surface-variant font-label-md text-xs sm:text-label-md opacity-60">
        Sign In
      </span>
      <span className="bg-primary/70 text-on-primary px-3.5 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md shadow-sm">
        Launch Mission
      </span>
    </div>
  );
}

export async function LandingAuthNav() {
  const session = await getSession();

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
