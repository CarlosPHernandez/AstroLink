'use client';

import { useEffect, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

export const CHRIS_QUESTION_QUEUE = [
  '"How do we handle orbital debris during descent?"',
  '"What does the Earth look like during a solar eclipse from orbit?"',
  '"What\'s the protocol for a loss of communication in the dead zone?"',
  '"Can you describe the physical sensation of entering zero-G?"',
  '"How do you manage the psychological shift of the overview effect?"',
] as const;

const MOBILE_SCROLL_QUESTIONS = [
  '"What was the most unexpected challenge during the Inspiration4 mission timeline?"',
  '"How do you prepare mentally for the initial launch sequence when sitting in the Dragon capsule?"',
  '"Can you describe the visual transition from atmosphere to the vacuum of space?"',
] as const;

const ROTATE_MS = 4000;
const FADE_MS = 1000;

type ChrisQuestionQueueProps = {
  variant?: 'rotate' | 'scroll';
};

export function ChrisQuestionQueue({ variant = 'rotate' }: ChrisQuestionQueueProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (variant !== 'rotate') {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % CHRIS_QUESTION_QUEUE.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [variant]);

  if (variant === 'scroll') {
    const looped = [...MOBILE_SCROLL_QUESTIONS, ...MOBILE_SCROLL_QUESTIONS];

    return (
      <div className="flex flex-col gap-2" data-testid="chris-question-queue">
        <h3 className="text-xs font-medium uppercase tracking-wider text-outline">
          Live Queue Highlights
        </h3>
        <div className="chris-fade-mask-y relative h-48 overflow-hidden">
          <div className="chris-queue-scroll flex flex-col gap-3 motion-reduce:transform-none">
            {looped.map((question, questionIndex) => (
              <div
                key={`${questionIndex}-${question}`}
                className="chris-glass-card flex items-start gap-3 rounded-lg p-3"
              >
                <MaterialIcon name="forum" className="shrink-0 text-[20px] text-outline-variant" />
                <p className="line-clamp-2 text-sm font-light text-surface-bright/90">{question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chris-fade-in-up chris-delay-500 chris-form-max flex min-h-12 w-full items-center justify-center pt-8 md:justify-start">
      <p
        className={`text-sm font-light italic text-secondary-fixed-dim/50 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        data-testid="chris-question-queue"
      >
        {CHRIS_QUESTION_QUEUE[index]}
      </p>
    </div>
  );
}