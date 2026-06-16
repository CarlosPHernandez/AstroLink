import Link from 'next/link';
import ExpertDirectory from '@/components/landing/expert-directory';
import { LandingAuthNavClient } from '@/components/landing/landing-auth-nav-client';
import { MaterialIcon } from '@/components/ui/material-icon';
import { getDashboardPathForRole } from '@/lib/dashboard-paths';
import type { ListedExpert } from '@/lib/mentor-directory';
import type { SessionData } from '@/lib/session';

type ActionCard = {
  href: string;
  title: string;
  description: string;
  icon: string;
  primary?: boolean;
  testId?: string;
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function actionsForSession(session: SessionData): ActionCard[] {
  if (session.role === 'admin') {
    return [
      {
        href: '/dashboard/admin',
        title: 'Admin dashboard',
        description: 'Waitlist metrics, compliance, and platform ops.',
        icon: 'shield',
        primary: true,
        testId: 'signed-in-cta-dashboard',
      },
      {
        href: '/experts',
        title: 'Expert directory',
        description: 'Review public expert listings and profiles.',
        icon: 'person',
        testId: 'signed-in-cta-experts',
      },
    ];
  }

  if (session.role === 'mentor') {
    const cards: ActionCard[] = [
      {
        href: '/dashboard/mentor',
        title: 'Mentor dashboard',
        description: 'Upcoming sessions, earnings, and your profile.',
        icon: 'videocam',
        primary: true,
        testId: 'signed-in-cta-dashboard',
      },
      {
        href: '/experts',
        title: 'Public directory',
        description: 'See how mentees browse and discover experts.',
        icon: 'person',
        testId: 'signed-in-cta-experts',
      },
    ];

    if (!session.onboarded) {
      cards.unshift({
        href: '/onboard',
        title: 'Complete setup',
        description: 'Finish mentor onboarding to accept bookings.',
        icon: 'rocket_launch',
        primary: true,
        testId: 'signed-in-cta-onboard',
      });
    }

    return cards;
  }

  return [
    {
      href: '/booking',
      title: 'Book a session',
      description: 'Pick an expert and schedule a live 1:1 call.',
      icon: 'videocam',
      primary: true,
      testId: 'signed-in-cta-book',
    },
    {
      href: '/experts',
      title: 'Browse experts',
      description: 'Watch intros, read bios, and compare rates.',
      icon: 'person',
      testId: 'signed-in-cta-experts',
    },
    {
      href: getDashboardPathForRole(session.role),
      title: 'My dashboard',
      description: 'Upcoming sessions, briefings, and account settings.',
      icon: 'auto_awesome',
      testId: 'signed-in-cta-dashboard',
    },
  ];
}

function roleSubtitle(session: SessionData): string {
  if (session.role === 'admin') {
    return 'Platform overview and expert roster at a glance.';
  }
  if (session.role === 'mentor') {
    return session.onboarded
      ? 'Manage sessions and see how mentees discover you.'
      : 'Finish setup, then start accepting live sessions.';
  }
  return 'Book verified experts or pick up where you left off.';
}

export default function LandingSignedInShell({
  session,
  experts,
}: {
  session: SessionData;
  experts: ListedExpert[];
}) {
  const actions = actionsForSession(session);

  return (
    <div
      className="min-h-screen bg-background text-on-surface font-sans overflow-x-hidden"
      data-testid="signed-in-home"
    >
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <Link
            href="/"
            className="font-bold text-lg text-on-surface tracking-tight hover:text-primary transition-colors"
          >
            AstroLink
          </Link>
          <div className="flex items-center gap-sm sm:gap-lg">
            <Link
              href="/experts"
              className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors"
            >
              Experts
            </Link>
            <LandingAuthNavClient />
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-[1200px] mx-auto px-md sm:px-lg py-10 sm:py-14">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary mb-2">
            Welcome back
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Hi, {firstName(session.fullName)}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-on-surface-variant font-light max-w-2xl">
            {roleSubtitle(session)}
          </p>

          <div
            className={`mt-8 grid gap-3 sm:gap-4 ${
              actions.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
            {actions.map((action) => (
              <Link
                key={action.href + action.title}
                href={action.href}
                data-testid={action.testId}
                className={`group flex flex-col rounded-xl border p-4 sm:p-5 transition-all touch-manipulation ${
                  action.primary
                    ? 'border-primary/30 bg-primary-fixed/20 hover:border-primary hover:shadow-md'
                    : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-sm'
                }`}
              >
                <MaterialIcon
                  name={action.icon}
                  className={action.primary ? 'text-primary' : 'text-on-surface-variant'}
                  size={24}
                />
                <p className="mt-3 text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {action.title}
                </p>
                <p className="mt-1 text-label-sm text-on-surface-variant leading-snug">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {session.role === 'mentee' ? <ExpertDirectory experts={experts} /> : null}
      </main>

      <footer className="border-t border-outline-variant bg-white">
        <div className="max-w-[1200px] mx-auto py-10 px-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="font-bold text-on-surface tracking-tight">AstroLink</div>
          <div className="text-on-surface-variant font-mono text-[10px]">
            © 2026 AstroLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}