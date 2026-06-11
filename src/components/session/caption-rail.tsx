'use client';

import { useEffect, useRef } from 'react';

import type { CaptionLine } from '@/components/session/use-live-captions';

type CaptionRailProps = {
  lines: CaptionLine[];
  captionsOn: boolean;
  onToggleCaptions?: () => void;
  showToggle?: boolean;
  targetLocale?: string;
  translationPaused?: boolean;
  transcriptionUnavailable?: boolean;
};

export function CaptionRail({
  lines,
  captionsOn,
  onToggleCaptions,
  showToggle = false,
  targetLocale,
  translationPaused = false,
  transcriptionUnavailable = false,
}: CaptionRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  if (!captionsOn && !showToggle && !transcriptionUnavailable) {
    return null;
  }

  return (
    <div
      className="flex max-h-36 min-h-[5.5rem] flex-col gap-2 border-t border-outline-variant bg-surface-container-lowest p-3"
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

      {transcriptionUnavailable ? (
        <p className="text-label-sm text-on-surface-variant" data-testid="caption-rail-unavailable">
          Live captions are unavailable for this session.
        </p>
      ) : null}

      {translationPaused ? (
        <p className="text-label-sm text-on-surface-variant" data-testid="caption-rail-paused">
          Live translation paused — showing original speech.
        </p>
      ) : null}

      {captionsOn && !transcriptionUnavailable ? (
        <div ref={scrollRef} className="max-h-28 space-y-2 overflow-y-auto">
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
