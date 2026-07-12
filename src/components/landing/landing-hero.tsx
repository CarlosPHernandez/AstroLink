'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { useLandingHeroParallax } from '@/components/landing/landing-scroll-reveal';
import { landingHeroPortrait } from '@/lib/landing-featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

const AI_CHAT = [
  { role: 'user' as const, text: 'I want to work in space. Where should I start?' },
  {
    role: 'assistant' as const,
    text: 'A verified expert can help you map classes, internships, and first projects.',
  },
  {
    role: 'assistant' as const,
    text: 'Create a free account to unlock the private network.',
  },
] as const;

const CHAT_STEP_MS = 2600;
const CHAT_PAUSE_MS = 3800;
const UNLOCK_HREF = '/auth?mode=signup&redirect=%2Fexperts';
const PENDING_GOAL_STORAGE_KEY = 'astrolink.pendingLearningGoal';

type LandingHeroProps = {
  experts: ListedExpert[];
};

export default function LandingHero({ experts }: LandingHeroProps) {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [goal, setGoal] = useState('');
  const [unlockVisible, setUnlockVisible] = useState(false);
  const visualRef = useLandingHeroParallax<HTMLDivElement>();
  const { src: heroImage, alt: heroAlt } = landingHeroPortrait(experts);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reducedMotionTimer = setTimeout(() => setVisibleMessages(AI_CHAT.length), 0);
      return () => clearTimeout(reducedMotionTimer);
    }

    let cancelled = false;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const run = () => {
      if (cancelled) return;

      if (step < AI_CHAT.length) {
        setVisibleMessages(step + 1);
        step += 1;
        timer = setTimeout(run, step === 1 ? 800 : CHAT_STEP_MS);
        return;
      }

      timer = setTimeout(() => {
        if (cancelled) return;
        setVisibleMessages(0);
        step = 0;
        timer = setTimeout(run, 600);
      }, CHAT_PAUSE_MS);
    };

    timer = setTimeout(run, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      return;
    }

    try {
      window.sessionStorage.setItem(PENDING_GOAL_STORAGE_KEY, trimmedGoal);
    } catch {
      // Browsers can block storage; the unlock flow still works without persistence.
    }

    setUnlockVisible(true);
  };

  return (
    <section className="pt-6 sm:pt-12 pb-12 sm:pb-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-md lg:px-lg text-center">
        <h1
          data-testid="landing-hero-title"
          className="landing-hero-intro font-landing-display text-[1.625rem] leading-[1.14] sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-[var(--landing-text)] sm:leading-[1.12]"
        >
          Talk to people who have
          <br className="hidden sm:block" />
          {' '}actually done the work in space.
        </h1>
        <p className="landing-hero-subcopy mt-3 sm:mt-4 text-[0.9375rem] sm:text-base text-[var(--landing-muted)] max-w-[var(--max-width-prose)] mx-auto leading-relaxed px-1">
          Create a free account to unlock astronauts, engineers, operators, and career mentors.
        </p>

        <form
          className="landing-hero-prompt group mt-6 sm:mt-10 mx-auto flex w-full max-w-[var(--max-width-prose)] items-center gap-2.5 sm:gap-3 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 sm:px-5 py-3 sm:py-3.5 text-left shadow-[0_14px_42px_-20px_rgba(14,20,32,0.22)] transition-shadow focus-within:shadow-[0_18px_48px_-18px_rgba(14,20,32,0.26)] hover:shadow-[0_18px_48px_-18px_rgba(14,20,32,0.26)]"
          onSubmit={handleGoalSubmit}
        >
          <label htmlFor="landing-goal" className="sr-only">
            What do you want to learn about space?
          </label>
          <input
            id="landing-goal"
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="What do you want to learn about space?"
            className="min-w-0 flex-1 bg-transparent text-[0.8125rem] sm:text-base text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:outline-none"
            autoComplete="off"
            data-testid="landing-goal-input"
          />
          <button
            type="submit"
            aria-label="Unlock the expert network"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white transition-colors hover:bg-[var(--landing-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-surface)]"
            data-testid="landing-goal-submit"
          >
            <MaterialIcon name="arrow_forward" size={16} />
          </button>
        </form>

        {unlockVisible ? (
          <div
            className="landing-hero-unlock mt-3 sm:mt-4 mx-auto w-full max-w-[var(--max-width-prose)] rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4 sm:p-5 text-left shadow-[0_18px_46px_-26px_rgba(14,20,32,0.28)]"
            role="status"
            aria-live="polite"
            data-testid="landing-unlock-panel"
          >
            <p className="text-sm sm:text-base font-semibold text-[var(--landing-text)]">
              Create your free AstroLink account
            </p>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--landing-muted)]">
              Unlock the private expert network and see available astronauts, engineers, and space
              professionals who can help. No payment required to browse.
            </p>
            <Link
              href={UNLOCK_HREF}
              className="mt-4 inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[var(--landing-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)]"
              data-testid="landing-unlock-cta"
            >
              Unlock the network
            </Link>
          </div>
        ) : null}
      </div>

      <div
        ref={visualRef}
        className="landing-hero-visual relative max-w-[920px] mx-auto mt-8 sm:mt-14 px-4 sm:px-md lg:px-lg"
        style={
          {
            '--landing-hero-scroll': '0',
            '--landing-hero-scroll-raw': '0',
          } as CSSProperties
        }
      >
        <div className="landing-hero-image-wrap landing-hero-portrait relative mx-auto w-full max-w-[min(92vw,420px)] sm:max-w-[640px] aspect-[3/4] sm:aspect-[5/6] overflow-hidden rounded-sm">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 640px) 92vw, 640px"
          />
          <div className="landing-hero-image-fade pointer-events-none absolute inset-0" aria-hidden />
        </div>

        <div
          className="landing-hero-phone relative sm:absolute sm:right-8 lg:right-12 sm:-bottom-10 mx-auto mt-6 sm:mt-0 w-full sm:w-[300px] max-w-[var(--max-width-prose)] sm:max-w-none"
          aria-label="AI chat preview"
        >
          <div className="landing-hero-phone-shell rounded-[1.75rem] sm:rounded-[2rem] border border-[color:var(--landing-border)] bg-[var(--landing-surface)] p-2.5 sm:p-3 shadow-[0_22px_56px_-18px_rgba(14,20,32,0.22)] sm:shadow-[0_26px_64px_-16px_rgba(14,20,32,0.22)]">
            <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-[var(--landing-faint)]">
              <span>Learning goal</span>
              <span>Private network</span>
            </div>
            <div className="rounded-[1.25rem] sm:rounded-[1.4rem] bg-[var(--landing-surface-soft)] px-3 py-3.5 sm:py-4 min-h-[190px] sm:min-h-[250px] flex flex-col justify-end gap-2">
              {AI_CHAT.slice(0, visibleMessages).map((message, index) => (
                <p
                  key={`${message.role}-${index}-${visibleMessages}`}
                  className={`landing-hero-chat-line text-[11px] sm:text-xs leading-snug rounded-2xl px-3 py-2 max-w-[94%] sm:max-w-[92%] ${
                    message.role === 'user'
                      ? 'ml-auto bg-[var(--landing-ink)] text-white rounded-br-sm'
                      : 'mr-auto bg-[var(--landing-surface)] text-[var(--landing-muted)] border border-[var(--landing-border)] rounded-bl-sm'
                  }`}
                >
                  {message.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="landing-hero-actions mt-8 sm:mt-12 flex flex-col items-stretch sm:items-center justify-center gap-2.5 sm:flex-row sm:gap-4 px-4 sm:px-md max-w-[var(--max-width-prose)] sm:max-w-none mx-auto">
        <Link
          href={UNLOCK_HREF}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[var(--landing-accent)] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[var(--landing-accent-hover)] transition-colors"
        >
          Create free account
        </Link>
        <Link
          href={UNLOCK_HREF}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-8 py-3.5 text-sm font-semibold text-[var(--landing-muted)] hover:text-[var(--landing-text)] transition-colors"
        >
          Unlock expert network
        </Link>
      </div>

      <ul className="landing-hero-trust mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-0 text-center text-xs sm:text-sm text-[var(--landing-faint)] px-4">
        <li>Verified experts</li>
        <li aria-hidden className="hidden sm:inline px-2">
          ·
        </li>
        <li>Free account to browse</li>
        <li aria-hidden className="hidden sm:inline px-2">
          ·
        </li>
        <li>Live 1:1 video</li>
      </ul>
    </section>
  );
}
