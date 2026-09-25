import { expertInitials } from '@/lib/expert-profile-media';

export function ExpertInitials({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[var(--landing-surface-soft,#eef1f4)] text-[var(--landing-ink,#1c2430)] ${className}`}
      aria-hidden="true"
    >
      <span className="font-semibold tracking-wide">{expertInitials(name)}</span>
    </div>
  );
}
