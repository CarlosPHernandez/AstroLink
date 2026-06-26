'use client';

export function BriefingUpgradeBanner({ onRegenerate }: { onRegenerate?: () => void }) {
  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-4 text-sm text-on-surface">
      <p className="leading-relaxed">
        This brief uses an older format. Regenerate for a personalized brief written directly to
        you.
      </p>
      {onRegenerate ? (
        <button
          type="button"
          onClick={onRegenerate}
          className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary hover:text-primary-container cursor-pointer"
        >
          Regenerate brief
        </button>
      ) : null}
    </div>
  );
}