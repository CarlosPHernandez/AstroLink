import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function ExpertNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-lg text-center bg-background">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
        Expert not found
      </p>
      <h1 className="mt-4 text-headline-md font-semibold text-on-surface">
        This profile is not in the verified directory.
      </h1>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant font-light">
        The expert may not be listed yet or the link may be outdated.
      </p>
      <Link
        href="/experts"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container"
      >
        <MaterialIcon name="arrow_back" size={18} />
        Back to directory
      </Link>
    </div>
  );
}
