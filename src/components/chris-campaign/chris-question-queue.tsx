'use client';

import { useEffect, useState } from 'react';

const CHRIS_QUESTION_QUEUE = [
  '"How do we handle orbital debris during descent?"',
  '"What does the Earth look like during a solar eclipse from orbit?"',
  '"What\'s the protocol for a loss of communication in the dead zone?"',
  '"Can you describe the physical sensation of entering zero-G?"',
  '"How do you manage the psychological shift of the overview effect?"',
] as const;

const ROTATE_MS = 4000;
const FADE_MS = 1000;

export function ChrisQuestionQueue() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div className="chris-fade-in-up chris-delay-500 chris-form-max flex min-h-12 w-full items-center justify-center pt-8 lg:justify-start">
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