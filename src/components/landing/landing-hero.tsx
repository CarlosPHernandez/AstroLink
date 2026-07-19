'use client';

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { LandingHeroHeadline } from '@/components/landing/landing-hero-headline';
import { useLandingHeroParallax } from '@/components/landing/landing-scroll-reveal';
import { useLandingHeroChat } from '@/components/landing/use-landing-hero-chat';
import {
  buildFallbackRelayMessages,
  type LandingRelayChatMessage,
} from '@/lib/landing/hero-relay';
import {
  landingHeroPortrait,
  pickLandingRelayExpert,
  type LandingRelayExpert,
} from '@/lib/landing/featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

const BROWSE_HREF = '/experts';
const BOOK_SIGNUP_HREF = '/auth?mode=signup&redirect=%2Fbooking';
const PENDING_GOAL_STORAGE_KEY = 'astrolink.pendingLearningGoal';

const PATH_CHIPS = [
  {
    id: 'student',
    label: 'Student',
    goal: 'I am a student exploring a career in space. Where should I start?',
  },
  {
    id: 'career',
    label: 'Career switcher',
    goal: 'I want to switch into aerospace. What paths actually work?',
  },
  {
    id: 'team',
    label: 'Team / org',
    goal: 'Our team needs operator perspective on a space project. How do we get started?',
  },
] as const;

const DEMO_CHAT: LandingRelayChatMessage[] = [
  { role: 'user', text: 'I want to work in space. Where should I start?' },
  {
    role: 'expert',
    text: 'Worth mapping classes, internships, and first projects with someone who has actually done the work.',
  },
  {
    role: 'expert',
    text: 'Ask your own question above to see who in the network fits your goal.',
  },
];

type LandingHeroProps = {
  experts: ListedExpert[];
};

export default function LandingHero({ experts }: LandingHeroProps) {
  const [goal, setGoal] = useState('');
  const [submittedGoal, setSubmittedGoal] = useState<string | null>(null);
  const [relayExpert, setRelayExpert] = useState<LandingRelayExpert | null>(null);
  const [chatMessages, setChatMessages] = useState<LandingRelayChatMessage[] | null>(null);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const visualRef = useLandingHeroParallax<HTMLDivElement>();
  const phoneRef = useRef<HTMLDivElement>(null);
  const { src: heroImage, alt: heroAlt } = landingHeroPortrait(experts);

  const messages = useMemo(() => {
    if (chatMessages) {
      return chatMessages;
    }
    return DEMO_CHAT;
  }, [chatMessages]);

  const { lines, isComplete } = useLandingHeroChat({
    messages,
    loop: submittedGoal === null && !isLoadingReply,
    typeExpertReplies: submittedGoal !== null,
  });

  const submitGoal = async (rawGoal: string, website = '') => {
    const trimmedGoal = rawGoal.trim();
    if (!trimmedGoal || isLoadingReply) {
      return;
    }

    const optimisticExpert = pickLandingRelayExpert(trimmedGoal, experts);

    try {
      window.sessionStorage.setItem(PENDING_GOAL_STORAGE_KEY, trimmedGoal);
      window.sessionStorage.setItem('astrolink.pendingRelayExpertSlug', optimisticExpert.slug);
    } catch {
      // Browsers can block storage; the unlock flow still works without persistence.
    }

    setGoal(trimmedGoal);
    setRelayExpert(optimisticExpert);
    setSubmittedGoal(trimmedGoal);
    setChatMessages([{ role: 'user', text: trimmedGoal }]);
    setIsLoadingReply(true);
    phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      const res = await fetch('/api/landing/relay-preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goal: trimmedGoal, website }),
      });

      if (!res.ok) {
        throw new Error(`relay-preview ${res.status}`);
      }

      const data = (await res.json()) as {
        expert: LandingRelayExpert;
        messages: LandingRelayChatMessage[];
        source: string;
      };

      setRelayExpert(data.expert);
      setChatMessages(data.messages);
      try {
        window.sessionStorage.setItem('astrolink.pendingRelayExpertSlug', data.expert.slug);
      } catch {
        // ignore
      }
    } catch {
      setRelayExpert(optimisticExpert);
      setChatMessages(buildFallbackRelayMessages(trimmedGoal, optimisticExpert));
    } finally {
      setIsLoadingReply(false);
    }
  };

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const website = String(formData.get('website') ?? '');
    void submitGoal(goal, website);
  };

  const handlePathChip = (pathGoal: string) => {
    setGoal(pathGoal);
    void submitGoal(pathGoal);
  };

  const continueHref =
    relayExpert && submittedGoal
      ? `/experts/${relayExpert.slug}`
      : BROWSE_HREF;

  return (
    <section className="landing-hero-section pt-5 sm:pt-12 pb-10 sm:pb-24">
      <div className="landing-hero-copy relative z-10 max-w-[1200px] mx-auto px-4 sm:px-md lg:px-lg text-center bg-[var(--landing-canvas)]">
        <LandingHeroHeadline />
        <p className="landing-hero-subcopy mt-2.5 sm:mt-4 text-[0.875rem] sm:text-base text-[var(--landing-muted)] max-w-[var(--max-width-prose)] mx-auto leading-relaxed px-0.5 text-pretty">
          Browse verified experts. Book a live 1:1 — not a generic AI answer.
        </p>

        <form
          className="landing-hero-prompt group mx-auto mt-5 sm:mt-10 flex w-full max-w-[var(--max-width-prose)] items-center gap-2 sm:gap-3 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-left shadow-[0_12px_36px_-22px_rgba(14,20,32,0.2)] transition-[box-shadow,border-color] duration-300 hover:border-[color:color-mix(in_srgb,var(--landing-border)_70%,var(--landing-muted))] focus-within:border-[var(--landing-border)] focus-within:shadow-[0_16px_40px_-20px_rgba(14,20,32,0.24)]"
          onSubmit={handleGoalSubmit}
        >
          <label htmlFor="landing-goal" className="sr-only">
            What do you want to learn about space?
          </label>
          {/* Honeypot — leave empty; bots often fill it */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            defaultValue=""
          />
          <input
            id="landing-goal"
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="What do you want to learn?"
            maxLength={280}
            disabled={isLoadingReply}
            className="min-w-0 flex-1 bg-transparent text-[0.9375rem] sm:text-base text-[var(--landing-text)] placeholder:text-[var(--landing-faint)] focus:outline-none disabled:opacity-60"
            autoComplete="off"
            enterKeyHint="go"
            data-testid="landing-goal-input"
          />
          <button
            type="submit"
            aria-label="Send your learning goal"
            disabled={isLoadingReply}
            className="inline-flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-surface)] touch-manipulation disabled:opacity-50"
            data-testid="landing-goal-submit"
          >
            <MaterialIcon name="arrow_forward" size={16} />
          </button>
        </form>

        {!submittedGoal ? (
          <div
            className="landing-hero-paths mt-3.5 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-1"
            data-testid="landing-path-chips"
            role="group"
            aria-label="Suggested paths"
          >
            {PATH_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                data-testid={`landing-path-${chip.id}`}
                onClick={() => handlePathChip(chip.goal)}
                disabled={isLoadingReply}
                className="min-h-10 sm:min-h-0 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-[var(--landing-muted)] transition-colors hover:border-[color:color-mix(in_srgb,var(--landing-border)_50%,var(--landing-muted))] hover:text-[var(--landing-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 touch-manipulation active:scale-[0.98] disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}

        {!submittedGoal ? (
          <p className="landing-hero-actions mt-4 sm:mt-5 text-xs sm:text-sm text-[var(--landing-faint)] leading-relaxed">
            Free to browse.{' '}
            <Link
              href={BROWSE_HREF}
              className="inline-block py-1 text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
            >
              See all experts
            </Link>
            <span className="mx-1.5 text-[var(--landing-border)]" aria-hidden>
              ·
            </span>
            <Link
              href={BOOK_SIGNUP_HREF}
              className="inline-block py-1 text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
            >
              Create account to book
            </Link>
          </p>
        ) : null}
      </div>

      <div
        ref={visualRef}
        className={`landing-hero-visual relative max-w-[920px] mx-auto mt-6 sm:mt-14 px-0 sm:px-md lg:px-lg${submittedGoal ? ' landing-hero-visual--goal-active' : ''}`}
        data-testid={submittedGoal ? 'landing-hero-goal-active' : undefined}
        style={
          {
            '--landing-hero-scroll': '0',
            '--landing-hero-scroll-raw': '0',
          } as CSSProperties
        }
      >
        <div className="landing-hero-image-wrap landing-hero-portrait relative mx-auto w-full max-w-[min(100%,360px)] sm:max-w-[640px] aspect-[3/4] max-h-[min(52vh,420px)] sm:max-h-none sm:aspect-[5/6] overflow-hidden rounded-sm sm:rounded-sm">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 640px"
          />
          <div className="landing-hero-image-fade pointer-events-none absolute inset-0" aria-hidden />
        </div>

        <div
          ref={phoneRef}
          className={`landing-hero-phone absolute z-[2] w-[min(86vw,272px)] left-0 right-0 mx-auto bottom-[-3.5rem] sm:left-auto sm:right-8 lg:right-12 sm:bottom-[-2.5rem] sm:mx-0 sm:w-[300px]${submittedGoal ? ' landing-hero-phone--active' : ''}`}
          aria-label="Expert relay preview"
          aria-live={submittedGoal ? 'polite' : undefined}
        >
          <div className="landing-hero-phone-shell rounded-[1.6rem] sm:rounded-[2rem] border border-[color:var(--landing-border)] bg-[var(--landing-surface)] p-2 sm:p-3 shadow-[0_22px_56px_-18px_rgba(14,20,32,0.22)] sm:shadow-[0_26px_64px_-16px_rgba(14,20,32,0.22)]">
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

            <div className="rounded-[1.15rem] sm:rounded-[1.4rem] bg-[var(--landing-surface-soft)] px-2.5 py-2.5 sm:px-3 sm:py-4 min-h-[150px] sm:min-h-[250px] flex flex-col justify-end gap-1.5 sm:gap-2">
              {lines.map((line, index) =>
                line.role === 'user' ? (
                  <p
                    key={`chat-line-${index}`}
                    data-testid={index === 0 ? 'landing-hero-user-message' : undefined}
                    className="landing-hero-chat-line ml-auto max-w-[94%] sm:max-w-[92%] rounded-2xl rounded-br-sm bg-[var(--landing-ink)] px-3 py-2 text-[11px] sm:text-xs leading-snug text-white"
                  >
                    {line.displayText}
                  </p>
                ) : (
                  <div
                    key={`chat-line-${index}`}
                    className="landing-hero-chat-line mr-auto max-w-[94%] sm:max-w-[92%]"
                  >
                    {relayExpert && submittedGoal ? (
                      <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--landing-faint)]">
                        {relayExpert.firstName} · preview
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

              {isLoadingReply ? (
                <p
                  className="mr-auto text-[10px] text-[var(--landing-faint)] px-1"
                  data-testid="landing-hero-reply-loading"
                >
                  Matching an expert…
                </p>
              ) : null}

              {submittedGoal && isComplete && !isLoadingReply ? (
                <>
                  <Link
                    href={continueHref}
                    className="landing-hero-relay-cta mt-1 inline-flex min-h-10 touch-manipulation items-center justify-center gap-1 rounded-full bg-[var(--landing-surface)] px-3 py-2.5 text-[11px] sm:min-h-0 sm:bg-transparent sm:py-2 sm:text-xs font-semibold text-[var(--landing-accent)] transition-colors hover:text-[var(--landing-accent-hover)] active:scale-[0.98]"
                    data-testid="landing-hero-journey-cta"
                  >
                    View {relayExpert?.firstName ?? 'expert'} profile
                    <MaterialIcon name="arrow_forward" size={14} />
                  </Link>
                  <p className="px-1 text-[9px] leading-snug text-[var(--landing-faint)]">
                    Illustrative preview — not a live expert reply. Book a real 1:1 to talk with them.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ul className="landing-hero-trust mt-[4.75rem] sm:mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] sm:text-sm text-[var(--landing-faint)] px-4">
        <li>Verified experts</li>
        <li aria-hidden className="text-[var(--landing-border)]">
          ·
        </li>
        <li>Browse free</li>
        <li aria-hidden className="text-[var(--landing-border)]">
          ·
        </li>
        <li>Live 1:1 video</li>
      </ul>
    </section>
  );
}
