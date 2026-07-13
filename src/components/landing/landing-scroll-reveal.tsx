'use client';

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';

type LandingScrollProgressOptions = {
  /** Wider scroll runway — section animates across more of the viewport travel */
  extended?: boolean;
  /** Sticky-pin runway — progress 0→1 while the section scrolls through its pin height */
  pinned?: boolean;
};

export function computePinnedScrollProgress(
  rectTop: number,
  sectionHeight: number,
  viewportHeight: number,
) {
  const runway = sectionHeight - viewportHeight;
  if (runway <= 0) return 1;
  return clamp01(-rectTop / runway);
}

type LandingScrollRevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'up' | 'left' | 'right' | 'scale';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number) {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

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
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
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

export function useLandingScrollProgress<T extends HTMLElement>(
  options: LandingScrollProgressOptions = {},
) {
  const ref = useRef<T>(null);
  const progressRef = useRef(-1);
  const frameRef = useRef<number | null>(null);
  const extended = options.extended ?? false;
  const pinned = options.pinned ?? false;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setVars = (raw: number) => {
      const eased = easeOutCubic(raw);
      if (eased === progressRef.current) return;
      progressRef.current = eased;
      el.style.setProperty('--landing-scroll-progress', String(eased));
      el.style.setProperty('--p-early', String(easeOutCubic(clamp01(raw * 1.55))));
      el.style.setProperty('--p-late', String(easeOutCubic(clamp01((raw - 0.12) / 0.88))));
      el.style.setProperty('--p-mid', String(easeOutCubic(clamp01((raw - 0.05) / 0.75))));
    };

    if (prefersReducedMotion()) {
      setVars(1);
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const raw = pinned
        ? computePinnedScrollProgress(rect.top, el.offsetHeight, viewport)
        : (() => {
            const enterAt = extended ? viewport * 0.96 : viewport * 0.9;
            const exitAt = extended ? -rect.height * 0.35 : viewport * 0.05;
            const span = enterAt - exitAt;
            return span > 0 ? (enterAt - rect.top) / span : 1;
          })();
      setVars(raw);
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
  }, [extended, pinned]);

  return ref;
}

export function useLandingHeroParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const shouldDisableParallax = () =>
      prefersReducedMotion() || window.matchMedia('(max-width: 639px)').matches;

    const update = () => {
      if (shouldDisableParallax()) {
        el.style.setProperty('--landing-hero-scroll', '0');
        el.style.setProperty('--landing-hero-scroll-raw', '0');
        return;
      }

      const rect = el.getBoundingClientRect();
      const traveled = Math.min(rect.height * 1.15, Math.max(0, -rect.top));
      const progress = rect.height > 0 ? traveled / (rect.height * 1.15) : 0;
      const eased = easeOutCubic(progress);
      el.style.setProperty('--landing-hero-scroll', String(eased));
      el.style.setProperty('--landing-hero-scroll-raw', String(progress));
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
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return ref;
}