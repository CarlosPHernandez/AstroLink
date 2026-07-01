type ChrisSegmentedProgressProps = {
  totalSegments: number;
  filledSegments: number;
  label: string;
  sublabel?: string;
  testId?: string;
  /** Gentle staggered pulse on unfilled segments (left → right). */
  pulseUnfilled?: boolean;
};

export function ChrisSegmentedProgress({
  totalSegments,
  filledSegments,
  label,
  sublabel,
  testId = 'chris-segmented-progress',
  pulseUnfilled = false,
}: ChrisSegmentedProgressProps) {
  const total = Math.max(1, totalSegments);
  const filled = Math.max(0, Math.min(total, filledSegments));
  const shouldPulse = pulseUnfilled && filled < total;

  return (
    <div className="flex w-full flex-col items-center gap-[1rem]" data-testid={testId}>
      <div className="flex items-center gap-[6px]" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const isFilled = index < filled;
          const isPulsing = shouldPulse && !isFilled;
          return (
            <div
              key={index}
              className={
                isFilled
                  ? 'h-4 w-[8px] -skew-x-[20deg] rounded-sm bg-white'
                  : `h-4 w-[8px] -skew-x-[20deg] rounded-sm border border-white/30${isPulsing ? ' chris-segment-pulse' : ''}`
              }
              style={
                isPulsing
                  ? { animationDelay: `${(index - filled) * 0.22}s` }
                  : undefined
              }
            />
          );
        })}
      </div>
      <div className="w-full space-y-[0.5rem] text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-white text-balance">
          {label}
        </p>
        {sublabel ? (
          <p className="chris-sublabel-max mx-auto text-xs leading-relaxed text-white/60 text-pretty">
            {sublabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}