'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toOptimizedImageUrl } from '@/lib/public-images';
import type { ListedExpert } from '@/lib/mentor-directory';

const ROTATION_SLUGS = ['chris-sembroski', 'priya-abiram', 'eiman-jahangir', 'andrew-parris'] as const;

const PREVIEW_COPY: Record<string, { question: string; answer: string; color: string }> = {
  'chris-sembroski': {
    question: 'I want to switch into aerospace. What paths actually work?',
    answer:
      'There are a few routes that actually work — happy to walk through what worked for me and where most people get stuck.',
    color: '#1859D4',
  },
  'priya-abiram': {
    question: 'What does it actually take to get into mission operations?',
    answer:
      'Less about the degree than people think, more about the projects. Happy to walk through what got me in the room.',
    color: '#0E1420',
  },
  'eiman-jahangir': {
    question: 'What does astronaut training actually involve day to day?',
    answer:
      "It's less glamorous than people expect at first, then very real all at once. Happy to walk through what training looked like.",
    color: '#66717F',
  },
  'andrew-parris': {
    question: 'How do I even start networking in this industry?',
    answer: 'Start narrower than you think — one project, one community, one expert. I can point you there.',
    color: '#171A1F',
  },
};

const DEFAULT_PREVIEW = {
  question: 'What should I actually be doing right now to break in?',
  answer: "Happy to talk through what's realistic for where you're starting from.",
  color: '#1859D4',
};

const ROTATION_MS = 5000;
const FADE_MS = 320;

type PreviewExpert = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  initials: string;
  imageSrc: string;
  question: string;
  answer: string;
  color: string;
};

function toPreviewExpert(expert: ListedExpert): PreviewExpert {
  const copy = PREVIEW_COPY[expert.slug] ?? DEFAULT_PREVIEW;
  const parts = expert.name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  return {
    slug: expert.slug,
    name: expert.name,
    firstName: parts[0] ?? expert.name,
    role: expert.role,
    initials,
    imageSrc: toOptimizedImageUrl(expert.imageUrl),
    question: copy.question,
    answer: copy.answer,
    color: copy.color,
  };
}

export function LandingExpertChatPreview({ experts }: { experts: ListedExpert[] }) {
  const rotation = useMemo(() => {
    const bySlug = new Map(experts.map((expert) => [expert.slug, expert]));
    return ROTATION_SLUGS.map((slug) => bySlug.get(slug))
      .filter((expert): expert is ListedExpert => Boolean(expert))
      .map(toPreviewExpert);
  }, [experts]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || rotation.length < 2) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % rotation.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [rotation.length, reducedMotion]);

  const current = rotation[index] ?? rotation[0];
  if (!current) return null;

  const opacity = reducedMotion || visible ? 1 : 0;

  return (
    <section className="py-4 sm:py-6" data-testid="landing-expert-chat-preview">
      <div className="max-w-[920px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] gap-5 items-end">
          <div
            className="relative overflow-hidden rounded-2xl bg-[var(--landing-surface-soft)]"
            style={{ aspectRatio: '5 / 6' }}
          >
            <Image
              src={current.imageSrc}
              alt={current.name}
              fill
              className="object-cover object-top transition-opacity"
              style={{ opacity, transitionDuration: `${FADE_MS}ms` }}
              sizes="(max-width: 640px) 90vw, 420px"
            />
          </div>

          <div
            className="rounded-[20px] border border-[var(--landing-border)] bg-[var(--landing-surface)] p-[18px] shadow-[0_22px_56px_-18px_rgba(14,20,32,0.18)] transition-opacity"
            style={{ opacity, transitionDuration: `${FADE_MS}ms` }}
          >
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[var(--landing-border)]">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: current.color }}
              >
                {current.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--landing-text)] truncate">{current.name}</p>
                <p className="text-[10px] text-[var(--landing-faint)] truncate">{current.role}</p>
              </div>
              <span className="rounded-full bg-[var(--landing-surface-soft)] px-2 py-0.5 text-[9px] font-bold tracking-[0.06em] text-[var(--landing-muted)]">
                VERIFIED
              </span>
            </div>

            <p className="ml-[20%] mb-2 rounded-[14px_14px_4px_14px] bg-[var(--landing-ink)] px-3 py-2 text-xs text-white">
              {current.question}
            </p>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--landing-faint)]">
              {current.firstName} · preview
            </p>
            <p className="mr-[8%] mb-3 rounded-[4px_14px_14px_14px] border border-[var(--landing-border)] px-3 py-2 text-xs text-[var(--landing-muted)]">
              {current.answer}
            </p>

            <Link
              href={`/experts/${current.slug}`}
              className="block w-full rounded-full bg-[var(--landing-ink)] px-3 py-2.5 text-center text-xs font-semibold text-white hover:opacity-90"
            >
              Book a session with {current.firstName}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
