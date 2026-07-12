'use client';

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';

type LandingScrollRevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'up' | 'left' | 'right' | 'scale';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LandingScrollReveal<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  delay = 0,
  variant = 'up',
  ...rest
}: LandingScrollRevealProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add('landing-reveal-visible');
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        const reveal = () => el.classList.add('landing-reveal-visible');
        if (delay > 0) {
          timeoutId = setTimeout(reveal, delay);
        } else {
          reveal();
        }
        observer.unobserve(el);
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay]);

  const variantClass =
    variant === 'left'
      ? 'landing-reveal-left'
      : variant === 'right'
        ? 'landing-reveal-right'
        : variant === 'scale'
          ? 'landing-reveal-scale'
          : 'landing-reveal-up';

  return (
    <Tag
      ref={ref as never}
      className={`landing-reveal ${variantClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function useLandingScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const progressRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setProgress = (value: number) => {
      const clamped = Math.min(1, Math.max(0, value));
      if (clamped === progressRef.current) return;
      progressRef.current = clamped;
      el.style.setProperty('--landing-scroll-progress', String(clamped));
    };

    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const start = viewport * 0.92;
      const end = viewport * 0.08;
      const next = 1 - (rect.top - end) / (start - end);
      setProgress(next);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return ref;
}