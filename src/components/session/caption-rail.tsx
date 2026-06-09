'use client';

import type { CaptionLine } from '@/components/session/use-live-captions';

type CaptionRailProps = {
  lines: CaptionLine[];
  captionsOn: boolean;
  onToggleCaptions?: () => void;
  showToggle?: boolean;
  targetLocale?: string;
};

export function CaptionRail({
  lines,
  captionsOn,
  onToggleCaptions,
  showToggle = false,
  targetLocale,
}: CaptionRailProps) {
  if (!captionsOn && !showToggle) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container-lowest/95 p-3 lg:absolute lg:bottom-20 lg:right-4 lg:z-10 lg:max-h-32 lg:w-80 lg:overflow-y-auto lg:rounded-lg lg:border lg:shadow-md"
      data-testid="caption-rail"
    >
      {showToggle && onToggleCaptions ? (
        <button
          type="button"
          data-testid="caption-rail-toggle"
          onClick={onToggleCaptions}
          className="self-start text-label-sm font-semibold text-primary underline"
        >
          {captionsOn ? 'Captions off' : 'Captions on'}
          {targetLocale ? ` (${targetLocale})` : ''}
        </button>
      ) : null}

      {captionsOn ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="text-label-sm text-on-surface-variant" data-testid="caption-rail-empty">
              Live captions will appear here.
            </p>
          ) : (
            lines.map((line, index) => (
              <div
                key={line.id}
                data-testid={`caption-rail-line-${index}`}
                className="text-body-md text-on-surface"
              >
                <span className="text-label-sm font-semibold text-on-surface-variant">
                  {line.speakerLabel}:{' '}
                </span>
                {line.loading ? (
                  <span className="text-on-surface-variant">…</span>
                ) : (
                  <span>{line.text}</span>
                )}
                {line.error ? (
                  <span
                    className="ml-2 text-label-sm text-error"
                    data-testid="caption-rail-translation-error"
                  >
                    Translation unavailable
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
