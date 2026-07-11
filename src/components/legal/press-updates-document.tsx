import Link from 'next/link';
import { PRESS_PAGE } from '@/content/press-updates';

export function PressUpdatesDocument() {
  return (
    <article className="min-w-0">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-[1.5rem] sm:text-[1.75rem] font-medium text-on-surface tracking-[-0.02em] leading-tight">
          Press
        </h1>
        <p className="mt-4 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed">
          {PRESS_PAGE.intro}
        </p>
      </header>

      <ol className="divide-y divide-outline-variant/50 border-t border-outline-variant/50">
        {PRESS_PAGE.updates.map((item) => (
          <li key={item.id} className="py-6 sm:py-8 first:pt-0">
            <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant/70">
              {item.date}
            </p>
            <h2 className="mt-2 text-base sm:text-lg font-medium text-on-surface leading-snug">
              {item.headline}
            </h2>
            <p className="mt-2 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed">
              {item.summary}
            </p>
            {item.link ? (
              <p className="mt-3">
                <Link
                  href={item.link.href}
                  className="text-sm text-on-surface hover:opacity-70 transition-opacity underline decoration-on-surface/25 underline-offset-2"
                >
                  {item.link.label}
                </Link>
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-10 pt-6 border-t border-outline-variant/50 text-sm text-on-surface-variant/70">
        Press inquiries:{' '}
        <a
          href={`mailto:${PRESS_PAGE.contactEmail}`}
          className="text-on-surface hover:opacity-70 transition-opacity underline decoration-on-surface/25 underline-offset-2"
        >
          {PRESS_PAGE.contactEmail}
        </a>
      </p>
    </article>
  );
}