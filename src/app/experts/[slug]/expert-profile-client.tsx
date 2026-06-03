'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ExpertIntroMedia } from '@/components/expert-intro-media';
import type { ListedExpert } from '@/lib/mentor-directory';

type SessionData = {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED_QUESTIONS = [
  'What kind of mentee would benefit most from a session?',
  'What is their background in commercial spaceflight?',
  'How do they typically approach technical questions?',
];

export default function ExpertProfileClient({
  expert,
  session,
}: {
  expert: ListedExpert;
  session: SessionData | null;
}) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const bookHref = session
    ? `/booking?mentor=${encodeURIComponent(expert.slug)}`
    : `/auth?redirect=${encodeURIComponent(`/booking?mentor=${expert.slug}`)}`;

  const sendQuestion = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || asking) return;

      setAskError(null);
      setAsking(true);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setQuestion('');

      try {
        const res = await fetch(`/api/experts/${encodeURIComponent(expert.slug)}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: trimmed }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? 'Could not get an answer right now.');
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.answer ?? '',
          },
        ]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.';
        setAskError(message);
        setMessages((prev) => prev.slice(0, -1));
        setQuestion(trimmed);
      } finally {
        setAsking(false);
      }
    },
    [asking, expert.slug],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-outline-variant/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-lg py-4">
          <Link
            href="/#directory"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Directory
          </Link>
          <Link
            href={bookHref}
            data-testid="expert-profile-book"
            className="rounded-md bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
          >
            {expert.availability === 'Available Now' ? 'Book session' : 'Schedule'} · ${expert.rate}/hr
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-lg pb-24 pt-8 md:pt-12">
        <div className="animate-reveal-down mb-6 flex flex-wrap items-end gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-outline-variant shadow-sm md:h-20 md:w-20">
            <Image src={expert.imageUrl} alt="" fill className="object-cover" sizes="80px" priority />
          </div>
          <div className="min-w-0 flex-grow">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              Verified expert
            </p>
            <h1
              className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface md:text-4xl"
              data-testid="expert-profile-name"
            >
              {expert.name}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant md:text-base">{expert.role}</p>
            <p className="text-xs text-outline md:text-sm">{expert.employer}</p>
          </div>
          {expert.availability === 'Available Now' ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                Available now
              </span>
            </div>
          ) : null}
        </div>

        <section className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 animate-reveal-up delay-100">
            <ExpertIntroMedia
              name={expert.name}
              imageUrl={expert.imageUrl}
              introVideoUrl={expert.introVideoUrl}
              className="aspect-[4/3] w-full lg:aspect-[16/10]"
              autoPlay
              priority
            />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">
              Watch how they present — tone, clarity, and energy before you book.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col animate-reveal-up delay-200">
            <h2 className="text-label-md font-semibold text-on-surface">About</h2>
            <p className="mt-4 text-body-md font-light leading-relaxed text-on-surface">{expert.bio}</p>

            <h3 className="mt-8 text-label-md font-semibold text-on-surface">Expertise</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {expert.expertise.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-outline-variant/80 bg-surface-container-low px-3 py-1.5 text-[11px] text-on-surface-variant"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <Link
                href={bookHref}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                {expert.availability === 'Available Now' ? 'Book a live session' : 'Schedule a session'}
              </Link>
            </div>
          </div>
        </section>

        <section
          className="mt-16 animate-reveal-up delay-300 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 md:p-8"
          aria-labelledby="ask-about-heading"
        >
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/10 px-3 py-1">
                <span className="material-symbols-outlined animate-ai-breathe text-[16px] text-primary">
                  auto_awesome
                </span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                  Profile assistant
                </span>
              </div>
              <h2 id="ask-about-heading" className="text-headline-md font-semibold text-on-surface">
                Ask about {expert.name.split(' ')[0]}
              </h2>
              <p className="mt-1 max-w-xl text-sm font-light text-on-surface-variant">
                Questions are answered from this verified profile only — a quick way to see fit before
                you book.
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="mb-6 max-h-[320px] space-y-4 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-primary text-on-primary'
                        : 'rounded-bl-sm border border-outline-variant/50 bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {asking && (
                <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant animate-ai-text-pulse">
                  Thinking…
                </p>
              )}
            </div>
          )}

          {askError && (
            <p className="mb-4 text-sm text-error" role="alert">
              {askError}
            </p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={asking}
                onClick={() => void sendQuestion(q)}
                className="rounded-full border border-outline-variant bg-white px-3 py-1.5 text-left text-[11px] text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuestion(question);
            }}
          >
            <label className="sr-only" htmlFor="expert-ask-input">
              Your question about {expert.name}
            </label>
            <input
              id="expert-ask-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`e.g. Would ${expert.name.split(' ')[0]} be a good fit for my propulsion roadmap?`}
              maxLength={500}
              disabled={asking}
              className="min-w-0 flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="expert-ask-input"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-secondary transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
              data-testid="expert-ask-submit"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Ask
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
