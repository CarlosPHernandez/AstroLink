'use client';

import { useEffect, useRef } from 'react';

import { CallControls } from '@/components/session/call-controls';
import { CaptionRail } from '@/components/session/caption-rail';
import { useDailyCall } from '@/components/session/use-daily-call';
import { useLiveCaptions } from '@/components/session/use-live-captions';
import { resolveViewerLocale } from '@/lib/transcript-translation/caption-direction';
import type { BookingSessionView } from '@/lib/booking-access';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

type DailyCallRoomProps = {
  booking: BookingSessionView;
  onEnded: () => void;
};

function VideoTile({
  label,
  track,
  mirrored,
}: {
  label: string;
  track: MediaStreamTrack | null;
  mirrored?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) {
      return;
    }
    if (!track) {
      el.srcObject = null;
      return;
    }
    const stream = new MediaStream([track]);
    el.srcObject = stream;
    void el.play().catch(() => undefined);
    return () => {
      el.srcObject = null;
    };
  }, [track]);

  return (
    <div className="relative flex aspect-video min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
      {track ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <span className="text-label-sm text-on-surface-variant">{label}</span>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-label-sm text-white">
        {label}
      </span>
    </div>
  );
}

export function DailyCallRoom({ booking, onEnded }: DailyCallRoomProps) {
  const isOwner = booking.sessionRole === 'mentor' || booking.sessionRole === 'admin';
  const viewerLocale = resolveViewerLocale(
    booking.sessionRole,
    booking.menteePreferredLocale,
  );

  const handleUtteranceRef = useRef<(utterance: TranscriptUtterance) => void>(() => {});

  const daily = useDailyCall({
    bookingId: booking.id,
    isOwner,
    transcriptionEnabled: booking.captionsAvailable,
    e2eCaptionsStub: booking.e2eCaptionsStub,
    onFinalTranscription: (utterance) => {
      void handleUtteranceRef.current(utterance);
    },
    onLeftMeeting: onEnded,
  });

  const captions = useLiveCaptions({
    bookingId: booking.id,
    mentorId: booking.mentorId,
    menteeId: booking.menteeId,
    sessionRole: booking.sessionRole,
    menteePreferredLocale: booking.menteePreferredLocale,
    mentorName: booking.mentorName,
    menteeName: booking.menteeName,
    captionsEnabled: booking.captionsAvailable,
    transcriptionUnavailable: daily.transcriptionUnavailable,
  });

  handleUtteranceRef.current = captions.handleUtterance;

  const local = daily.participants.find((p) => p.local);
  const remotes = daily.participants.filter((p) => !p.local);

  const handleLeave = () => {
    void daily.leave();
  };

  return (
    <div
      data-testid="session-daily-call"
      className="relative mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm"
    >
      <div className="relative flex min-h-[360px] flex-col gap-2 p-2 sm:flex-row">
        {daily.status === 'joining' && (
          <p className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container-lowest/80 text-body-md text-on-surface-variant">
            Joining video room…
          </p>
        )}
        {daily.status === 'error' && (
          <p
            className="w-full p-4 text-body-md text-error"
            data-testid="session-daily-call-error"
          >
            {daily.error ?? 'Could not join the video room.'}
          </p>
        )}
        <VideoTile label={local?.userName ?? 'You'} track={local?.videoTrack ?? null} mirrored />
        {remotes.map((p) => (
          <VideoTile key={p.sessionId} label={p.userName} track={p.videoTrack} />
        ))}
        {remotes.length === 0 && daily.status === 'joined' ? (
          <VideoTile label="Waiting for participant…" track={null} />
        ) : null}
      </div>

      {booking.captionsAvailable ? (
        <CaptionRail
          lines={captions.lines}
          captionsOn={captions.captionsOn}
          onToggleCaptions={() => captions.setCaptionsOn((v) => !v)}
          showToggle={booking.sessionRole === 'mentee'}
          targetLocale={viewerLocale}
          translationPaused={captions.translationPaused}
          transcriptionUnavailable={captions.transcriptionUnavailable}
        />
      ) : null}

      <CallControls
        micEnabled={daily.micEnabled}
        cameraEnabled={daily.cameraEnabled}
        onToggleMic={() => void daily.toggleMic()}
        onToggleCamera={() => void daily.toggleCamera()}
        onLeave={handleLeave}
      />
    </div>
  );
}
