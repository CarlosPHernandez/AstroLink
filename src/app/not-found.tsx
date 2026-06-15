import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-lg text-center">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
        Page not found
      </p>
      <h1 className="mt-4 text-headline-md font-semibold text-on-surface">
        This page is not on AstroLink.
      </h1>
      <p className="mt-2 max-w-md font-light text-body-md text-on-surface-variant">
        The link may be outdated, or the page may have moved. Head back to the home page or browse
        verified experts.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
        >
          Home
        </Link>
        <Link
          href="/experts"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-outline-variant px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          Browse experts
        </Link>
      </div>
    </div>
  );
}