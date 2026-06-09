'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyCall, DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import Daily from '@daily-co/daily-js';

import {
  parseTranscriptionMessage,
  transcriptionDedupeKey,
  type DailyTranscriptionMessagePayload,
} from '@/lib/transcript-translation/daily-transcription';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export type DailyCallStatus = 'idle' | 'joining' | 'joined' | 'left' | 'error';

export type UseDailyCallOptions = {
  joinUrl: string;
  isOwner: boolean;
  transcriptionEnabled: boolean;
  e2eCaptionsStub?: boolean;
  onFinalTranscription?: (utterance: TranscriptUtterance) => void;
  onLeftMeeting?: () => void;
};

export type ParticipantMedia = {
  sessionId: string;
  userName: string;
  local: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
};

function participantMediaFromDaily(p: DailyParticipant): ParticipantMedia {
  const videoTrack = p.tracks?.video?.persistentTrack ?? p.tracks?.video?.track ?? null;
  const audioTrack = p.tracks?.audio?.persistentTrack ?? p.tracks?.audio?.track ?? null;
  return {
    sessionId: p.session_id,
    userName: p.user_name ?? (p.local ? 'You' : 'Guest'),
    local: Boolean(p.local),
    videoTrack,
    audioTrack,
  };
}

export function useDailyCall(options: UseDailyCallOptions) {
  const {
    joinUrl,
    isOwner,
    transcriptionEnabled,
    e2eCaptionsStub = false,
    onFinalTranscription,
    onLeftMeeting,
  } = options;

  const callRef = useRef<DailyCall | null>(null);
  const seenSegmentsRef = useRef<Set<string>>(new Set());
  const onFinalRef = useRef(onFinalTranscription);
  const onLeftRef = useRef(onLeftMeeting);

  const [status, setStatus] = useState<DailyCallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantMedia[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  useEffect(() => {
    onFinalRef.current = onFinalTranscription;
  }, [onFinalTranscription]);

  useEffect(() => {
    onLeftRef.current = onLeftMeeting;
  }, [onLeftMeeting]);

  const refreshParticipants = useCallback((callObject: DailyCall) => {
    const all = callObject.participants();
    const list = Object.values(all).map(participantMediaFromDaily);
    setParticipants(list);
  }, []);

  const handleTranscription = useCallback((event?: DailyEventObject<'transcription-message'>) => {
    const payload = (event ?? {}) as DailyTranscriptionMessagePayload;
    const utterance = parseTranscriptionMessage(payload, { requireFinal: true });
    if (!utterance) {
      return;
    }
    const dedupeKey = transcriptionDedupeKey(utterance);
    if (seenSegmentsRef.current.has(dedupeKey)) {
      return;
    }
    seenSegmentsRef.current.add(dedupeKey);
    onFinalRef.current?.(utterance);
  }, []);

  useEffect(() => {
    if (e2eCaptionsStub) {
      type E2eCaptionsWindow = Window & {
        __ASTROLINK_E2E_CAPTIONS__?: {
          pushTranscriptionEvent: (payload: DailyTranscriptionMessagePayload) => void;
        };
      };
      const w = window as E2eCaptionsWindow;
      w.__ASTROLINK_E2E_CAPTIONS__ = {
        pushTranscriptionEvent: (payload) => {
          const utterance = parseTranscriptionMessage(
            { ...payload, is_final: true },
            { requireFinal: true },
          );
          if (utterance) {
            onFinalRef.current?.(utterance);
          }
        },
      };
      setStatus('joined');
      return () => {
        delete w.__ASTROLINK_E2E_CAPTIONS__;
        setStatus('left');
      };
    }

    if (!joinUrl) {
      return;
    }

    let cancelled = false;
    const callObject = Daily.createCallObject({
      subscribeToTracksAutomatically: true,
    });
    callRef.current = callObject;

    const onJoined = () => {
      if (cancelled) {
        return;
      }
      setStatus('joined');
      refreshParticipants(callObject);

      if (transcriptionEnabled && isOwner) {
        try {
          callObject.startTranscription({ language: 'en' });
        } catch (err: unknown) {
          console.warn('[daily] startTranscription fallback failed', err);
        }
      }
    };

    const onLeft = () => {
      if (cancelled) {
        return;
      }
      setStatus('left');
      onLeftRef.current?.();
    };

    const onError = (ev?: DailyEventObject<'error'>) => {
      if (cancelled) {
        return;
      }
      const message =
        (ev?.errorMsg as string | undefined) ??
        (ev?.error as { message?: string } | undefined)?.message ??
        'Daily call error';
      setError(message);
      setStatus('error');
    };

    callObject.on('joined-meeting', onJoined);
    callObject.on('left-meeting', onLeft);
    callObject.on('error', onError);
    callObject.on('participant-joined', () => refreshParticipants(callObject));
    callObject.on('participant-updated', () => refreshParticipants(callObject));
    callObject.on('participant-left', () => refreshParticipants(callObject));
    callObject.on('track-started', () => refreshParticipants(callObject));
    callObject.on('track-stopped', () => refreshParticipants(callObject));
    callObject.on('transcription-message', handleTranscription);

    setStatus('joining');
    void callObject.join({ url: joinUrl }).catch((err: unknown) => {
      if (cancelled) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to join call');
      setStatus('error');
    });

    return () => {
      cancelled = true;
      callObject.off('joined-meeting', onJoined);
      callObject.off('left-meeting', onLeft);
      callObject.off('error', onError);
      callObject.off('transcription-message', handleTranscription);
      void callObject.leave().finally(() => {
        callObject.destroy();
      });
      callRef.current = null;
    };
  }, [
    joinUrl,
    isOwner,
    transcriptionEnabled,
    e2eCaptionsStub,
    handleTranscription,
    refreshParticipants,
  ]);

  const leave = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      setStatus('left');
      onLeftRef.current?.();
      return;
    }
    await call.leave();
    call.destroy();
    callRef.current = null;
    setStatus('left');
    onLeftRef.current?.();
  }, []);

  const toggleMic = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      return;
    }
    const next = !micEnabled;
    await call.setLocalAudio(next);
    setMicEnabled(next);
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      return;
    }
    const next = !cameraEnabled;
    await call.setLocalVideo(next);
    setCameraEnabled(next);
  }, [cameraEnabled]);

  return {
    status,
    error,
    participants,
    micEnabled,
    cameraEnabled,
    leave,
    toggleMic,
    toggleCamera,
  };
}
