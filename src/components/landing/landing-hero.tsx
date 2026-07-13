'use client';

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { useLandingHeroParallax } from '@/components/landing/landing-scroll-reveal';
import { useLandingHeroChat } from '@/components/landing/use-landing-hero-chat';
import {
  landingHeroPortrait,
  landingRelayReplyCta,
  landingRelayReplyIntro,
  pickLandingRelayExpert,
  type LandingRelayExpert,
} from '@/lib/landing-featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

const UNLOCK_HREF = '/auth?mode=signup&redirect=%2Fexperts';
const PENDING_GOAL_STORAGE_KEY = 'astrolink.pendingLearningGoal';

const DEMO_CHAT = [
  { role: 'user' as const, text: 'I want to work in space. Where should I start?' },
  {
    role: 'expert' as const,
    text: 'Worth mapping classes, internships, and first projects with someone who has actually done the work.',
  },
  {
    role: 'expert' as const,
    text: 'Ask your own question above to see who in the network fits your goal.',
  },
];

function buildSubmittedChat(goal: string, expert: LandingRelayExpert) {
  return [
    { role: 'user' as const, text: goal },
    { role: 'expert' as const, text: landingRelayReplyIntro(expert) },
    { role: 'expert' as const, text: landingRelayReplyCta(expert) },
  ];
}

type LandingHeroProps = {
  experts: ListedExpert[];
};

export default function LandingHero({ experts }: LandingHeroProps) {
  const [goal, setGoal] = useState('');
  const [submittedGoal, setSubmittedGoal] = useState<string | null>(null);
  const [relayExpert, setRelayExpert] = useState<LandingRelayExpert | null>(null);
  const visualRef = useLandingHeroParallax<HTMLDivElement>();
  const phoneRef = useRef<HTMLDivElement>(null);
  const { src: heroImage, alt: heroAlt } = landingHeroPortrait(experts);

  const chatMessages = useMemo(() => {
    if (submittedGoal && relayExpert) {
      return buildSubmittedChat(submittedGoal, relayExpert);
    }
    return DEMO_CHAT;
  }, [submittedGoal, relayExpert]);

  const { lines, isComplete } = useLandingHeroChat({
    messages: chatMessages,
    loop: submittedGoal === null,
    typeExpertReplies: submittedGoal !== null,
  });

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      return;
    }

    const matchedExpert = pickLandingRelayExpert(trimmedGoal, experts);

    try {
      window.sessionStorage.setItem(PENDING_GOAL_STORAGE_KEY, trimmedGoal);
      window.sessionStorage.setItem('astrolink.pendingRelayExpertSlug', matchedExpert.slug);
    } catch {
      // Browsers can block storage; the unlock flow still works without persistence.
    }

    setRelayExpert(matchedExpert);
    setSubmittedGoal(trimmedGoal);
    phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          Ask a question below — we&apos;ll match you with a verified astronaut or engineer, not a
          generic AI answer.
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
            aria-label="Send your learning goal"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-white transition-colors hover:bg-[var(--landing-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-surface)]"
            data-testid="landing-goal-submit"
          >
            <MaterialIcon name="arrow_forward" size={16} />
          </button>
        </form>

        {!submittedGoal ? (
          <p className="landing-hero-actions mt-5 text-xs sm:text-sm text-[var(--landing-faint)]">
            Free to browse.{' '}
            <Link
              href={UNLOCK_HREF}
              className="text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
            >
              Create account
            </Link>{' '}
            when you&apos;re ready.
          </p>
        ) : null}
      </div>

      <div
        ref={visualRef}
        className={`landing-hero-visual relative max-w-[920px] mx-auto mt-8 sm:mt-14 px-4 sm:px-md lg:px-lg${submittedGoal ? ' landing-hero-visual--goal-active' : ''}`}
        data-testid={submittedGoal ? 'landing-hero-goal-active' : undefined}
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
          ref={phoneRef}
          className={`landing-hero-phone relative sm:absolute sm:right-8 lg:right-12 sm:-bottom-10 mx-auto mt-6 sm:mt-0 w-full sm:w-[300px] max-w-[var(--max-width-prose)] sm:max-w-none${submittedGoal ? ' landing-hero-phone--active' : ''}`}
          aria-label="Expert relay preview"
          aria-live={submittedGoal ? 'polite' : undefined}
        >
          <div className="landing-hero-phone-shell rounded-[1.75rem] sm:rounded-[2rem] border border-[color:var(--landing-border)] bg-[var(--landing-surface)] p-2.5 sm:p-3 shadow-[0_22px_56px_-18px_rgba(14,20,32,0.22)] sm:shadow-[0_26px_64px_-16px_rgba(14,20,32,0.22)]">
            {relayExpert && submittedGoal ? (
              <div
                className="landing-hero-relay-header flex items-center gap-2 px-2 pb-2.5 border-b border-[var(--landing-border)]/80"
                data-testid="landing-hero-relay-expert"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--landing-accent)]/20">
                  <Image
                    src={relayExpert.portraitSrc}
                    alt={relayExpert.portraitAlt}
                    fill
                    className="object-cover object-top"
                    sizes="32px"
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[11px] font-semibold text-[var(--landing-text)]">
                    {relayExpert.name}
                  </p>
                  <p className="truncate text-[9px] text-[var(--landing-faint)]">{relayExpert.role}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--landing-surface-soft)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-muted)]">
                  Verified
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-[var(--landing-faint)]">
                <span>Your question</span>
                <span>Expert relay</span>
              </div>
            )}

            <div className="rounded-[1.25rem] sm:rounded-[1.4rem] bg-[var(--landing-surface-soft)] px-3 py-3.5 sm:py-4 min-h-[190px] sm:min-h-[250px] flex flex-col justify-end gap-2">
              {lines.map((line, index) =>
                line.role === 'user' ? (
                  <p
                    key={`user-${index}-${line.displayText.length}`}
                    data-testid={index === 0 ? 'landing-hero-user-message' : undefined}
                    className="landing-hero-chat-line ml-auto max-w-[94%] sm:max-w-[92%] rounded-2xl rounded-br-sm bg-[var(--landing-ink)] px-3 py-2 text-[11px] sm:text-xs leading-snug text-white"
                  >
                    {line.displayText}
                  </p>
                ) : (
                  <div
                    key={`expert-${index}-${line.displayText.length}`}
                    className="landing-hero-chat-line mr-auto max-w-[94%] sm:max-w-[92%]"
                  >
                    {relayExpert && submittedGoal ? (
                      <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--landing-faint)]">
                        {relayExpert.firstName} · verified expert
                      </p>
                    ) : null}
                    <p className="rounded-2xl rounded-bl-sm border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-2 text-[11px] sm:text-xs leading-snug text-[var(--landing-muted)]">
                      <span className={line.isTyping ? 'landing-hero-typing-cursor' : undefined}>
                        {line.displayText}
                      </span>
                    </p>
                  </div>
                ),
              )}

              {submittedGoal && isComplete ? (
                <Link
                  href={UNLOCK_HREF}
                  className="landing-hero-relay-cta mt-1 inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] sm:text-xs font-semibold text-[var(--landing-accent)] transition-colors hover:text-[var(--landing-accent-hover)]"
                  data-testid="landing-hero-journey-cta"
                >
                  Continue your journey
                  <MaterialIcon name="arrow_forward" size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ul className="landing-hero-trust mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-0 text-center text-xs sm:text-sm text-[var(--landing-faint)] px-4">
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