type ChrisSlotIndicatorProps = {
  slotCap: number;
  slotsRemaining: number;
  variant?: 'bars' | 'pill' | 'hero';
};

function heroSlotLabel(slotsRemaining: number): string {
  if (slotsRemaining <= 0) {
    return 'All spots reserved';
  }
  if (slotsRemaining === 1) {
    return '1 Spot Remaining';
  }
  return `${slotsRemaining} Spots Remaining`;
}

function slotLabel(slotsRemaining: number): string {
  if (slotsRemaining <= 0) {
    return 'All sessions reserved';
  }
  if (slotsRemaining === 1) {
    return 'Only 1 spot remaining';
  }
  return `Only ${slotsRemaining} spots remaining`;
}

export function ChrisSlotIndicator({
  slotCap,
  slotsRemaining,
  variant = 'bars',
}: ChrisSlotIndicatorProps) {
  const totalBars = Math.max(1, slotCap);
  const filledBars = Math.max(0, Math.min(totalBars, totalBars - slotsRemaining));
  const soldOut = slotsRemaining <= 0;

  if (variant === 'hero') {
    return (
      <div
        className="chris-fade-in-up chris-delay-100 flex items-center gap-2"
        data-testid="chris-slot-indicator"
        aria-label={`${slotsRemaining} out of ${totalBars} spots remaining`}
      >
        <div className="flex gap-1 shadow-lg" aria-hidden="true">
          {Array.from({ length: totalBars }, (_, index) => {
            const filled = index < filledBars;
            return (
              <div
                key={index}
                className={
                  filled
                    ? 'h-4 w-2 -skew-x-[20deg] rounded-sm bg-white'
                    : 'h-4 w-2 -skew-x-[20deg] rounded-sm border border-white/30'
                }
              />
            );
          })}
        </div>
        <span className="ml-2 text-xs font-medium uppercase tracking-widest text-white">
          {heroSlotLabel(slotsRemaining)}
        </span>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className="chris-fade-in-up chris-delay-100 inline-flex w-fit items-center gap-2 rounded-full border border-tertiary-fixed-dim/30 bg-on-tertiary-fixed-variant px-3 py-1 shadow-[0_0_15px_rgba(11,62,164,0.3)]"
        data-testid="chris-slot-indicator"
      >
        {!soldOut ? (
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        ) : null}
        <span className="text-xs font-medium uppercase tracking-widest text-white">
          {slotLabel(slotsRemaining)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="chris-fade-in-up chris-delay-100 inline-flex flex-col gap-2"
      data-testid="chris-slot-indicator"
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalBars }, (_, index) => {
          const filled = index < filledBars;
          return (
            <div
              key={index}
              className={
                filled
                  ? 'h-4 w-1.5 skew-x-[-20deg] bg-white'
                  : 'h-4 w-1.5 skew-x-[-20deg] border border-white/30'
              }
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {!soldOut ? (
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-error opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
          </span>
        ) : null}
        <span className="text-xs font-medium uppercase tracking-widest text-white/80">
          {slotLabel(slotsRemaining)}
        </span>
      </div>
    </div>
  );
}