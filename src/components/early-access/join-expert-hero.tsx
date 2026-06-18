import type { ListedExpert } from '@/lib/mentor-directory';

type JoinExpertHeroProps = {
  expert: ListedExpert;
};

function credentialLine(expert: ListedExpert): string {
  const parts = [expert.role, expert.employer].filter(Boolean);
  return parts.join(' · ');
}

export function JoinExpertHero({ expert }: JoinExpertHeroProps) {
  const credentials = credentialLine(expert);

  return (
    <div className="w-full min-w-0 lg:max-w-[40rem]">
      <h1 className="text-[1.625rem] sm:text-[2.125rem] lg:text-[2.375rem] font-medium text-on-surface tracking-[-0.02em] leading-[1.2]">
        Book a live 1:1 session with{' '}
        <span className="text-on-surface">{expert.name}</span>.
      </h1>
      <p className="mt-3 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed">
        Join the AstroLink waitlist for verified aerospace experts—get notified when you can
        book a private video session
        {credentials ? (
          <>
            {' '}
            with <span className="text-on-surface font-medium">{credentials}</span>
          </>
        ) : null}
        .
      </p>
    </div>
  );
}