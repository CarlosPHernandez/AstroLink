'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { useLandingHeroParallax } from '@/components/landing/landing-scroll-reveal';
import { landingHeroPortrait } from '@/lib/landing-featured-expert';
import type { ListedExpert } from '@/lib/mentor-directory';

const AI_CHAT = [
  { role: 'user' as const, text: 'Second-stage thrust is oscillating late in the burn. What should we check?' },
  {
    role: 'assistant' as const,
    text: 'Review combustion stability margins and injector geometry against published references.',
  },
  {
    role: 'assistant' as const,
    text: 'I don\u2019t have your engine logs or flight telemetry. General reference only.',
  },
] as const;

const CHAT_STEP_MS = 2600;
const CHAT_PAUSE_MS = 3800;

type LandingHeroProps = {
  experts: ListedExpert[];
};

export default function LandingHero({ experts }: LandingHeroProps) {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const visualRef = useLandingHeroParallax<HTMLDivElement>();
  const { src: heroImage, alt: heroAlt, href: heroHref } = landingHeroPortrait(experts);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleMessages(AI_CHAT.length);
      return;
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

  return (
    <section className="pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg text-center">
        <h1
          data-testid="landing-hero-title"
          className="landing-hero-intro font-landing-display text-[1.75rem] sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-neutral-900 leading-[1.12]"
        >
          When the stakes are orbital,
          <br className="hidden sm:block" />
          {' '}you need a human who&apos;s been there.
        </h1>
        <p className="landing-hero-subcopy mt-4 text-sm sm:text-base text-neutral-500 max-w-[var(--max-width-prose)] mx-auto">
          Book verified operators for live 1:1 sessions — not another autocomplete answer.
        </p>

        <Link
          href="/auth"
          className="landing-hero-prompt group mt-8 sm:mt-10 mx-auto flex w-full max-w-[var(--max-width-prose)] items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 sm:px-5 py-3 sm:py-3.5 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.15)] transition-shadow hover:shadow-[0_16px_44px_-16px_rgba(0,0,0,0.2)]"
        >
          <span className="flex-1 text-sm sm:text-base text-neutral-400 group-hover:text-neutral-500 transition-colors">
            What mission question do you need answered?
          </span>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a5fd1] text-white">
            <MaterialIcon name="arrow_forward" size={18} />
          </span>
        </Link>
      </div>

      <div
        ref={visualRef}
        className="landing-hero-visual relative max-w-[920px] mx-auto mt-10 sm:mt-14 px-md sm:px-lg pb-8 sm:pb-0"
        style={
          {
            '--landing-hero-scroll': '0',
            '--landing-hero-scroll-raw': '0',
          } as CSSProperties
        }
      >
        <Link
          href={heroHref}
          className="landing-hero-image-wrap landing-hero-portrait block relative mx-auto w-full max-w-[580px] sm:max-w-[640px] aspect-[4/5] sm:aspect-[5/6] overflow-hidden rounded-sm"
        >
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 640px) 90vw, 640px"
          />
          <div className="landing-hero-image-fade pointer-events-none absolute inset-0" aria-hidden />
        </Link>

        <div
          className="landing-hero-phone relative sm:absolute sm:right-8 lg:right-12 sm:-bottom-10 mx-auto mt-8 sm:mt-0 w-[min(88vw,300px)] sm:w-[300px]"
          aria-label="AI chat preview"
        >
          <div className="landing-hero-phone-shell rounded-[2rem] border border-neutral-200/80 bg-white p-3 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-neutral-400">
              <span>General chat</span>
              <span>AI assistant</span>
            </div>
            <div className="rounded-[1.4rem] bg-neutral-50 px-3 py-4 min-h-[210px] sm:min-h-[250px] flex flex-col justify-end gap-2.5">
              {AI_CHAT.slice(0, visibleMessages).map((message, index) => (
                <p
                  key={`${message.role}-${index}-${visibleMessages}`}
                  className={`landing-hero-chat-line text-[11px] sm:text-xs leading-snug rounded-2xl px-3 py-2 max-w-[92%] ${
                    message.role === 'user'
                      ? 'ml-auto bg-neutral-900 text-white rounded-br-sm'
                      : 'mr-auto bg-white text-neutral-600 border border-neutral-200 rounded-bl-sm'
                  }`}
                >
                  {message.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="landing-hero-actions mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-md">
        <Link
          href="/auth"
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#1a5fd1] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#164fb3] transition-colors"
        >
          Book a session
        </Link>
        <Link
          href="/experts"
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-sm font-semibold text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Browse experts
        </Link>
      </div>

      <p className="landing-hero-trust mt-6 text-center text-xs sm:text-sm text-neutral-400 tracking-wide">
        Verified operators&nbsp;&nbsp;·&nbsp;&nbsp;Live 1:1 video&nbsp;&nbsp;·&nbsp;&nbsp;Clear pricing
      </p>
    </section>
  );
}