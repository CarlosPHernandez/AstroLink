'use client';

type CallControlsProps = {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  endLocalLabel?: string;
};

export function CallControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeave,
  endLocalLabel = 'End session',
}: CallControlsProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 p-4 border-t border-outline-variant bg-surface-container-lowest"
      data-testid="session-call-controls"
    >
      <button
        type="button"
        data-testid="session-toggle-mic"
        onClick={onToggleMic}
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-4 text-label-sm font-semibold text-on-surface hover:bg-surface-container-high"
        aria-pressed={!micEnabled}
      >
        {micEnabled ? 'Mute' : 'Unmute'}
      </button>
      <button
        type="button"
        data-testid="session-toggle-camera"
        onClick={onToggleCamera}
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-4 text-label-sm font-semibold text-on-surface hover:bg-surface-container-high"
        aria-pressed={!cameraEnabled}
      >
        {cameraEnabled ? 'Camera off' : 'Camera on'}
      </button>
      <button
        type="button"
        data-testid="session-end-local"
        onClick={onLeave}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-error px-6 py-2 text-label-sm font-semibold text-on-error hover:opacity-90"
      >
        {endLocalLabel}
      </button>
    </div>
  );
}
