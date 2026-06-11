'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DailyCall,
  DailyEventObject,
  DailyMeetingState,
  DailyParticipant,
} from '@daily-co/daily-js';
import Daily from '@daily-co/daily-js';

import { splitDailyJoinUrl } from '@/lib/daily-join-url';
import {
  parseTranscriptionMessage,
  transcriptionDedupeKey,
  type DailyTranscriptionMessagePayload,
} from '@/lib/transcript-translation/daily-transcription';
import {
  resolveSpeakerUserId,
  type DailyParticipantsMap,
} from '@/lib/transcript-translation/resolve-speaker';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export type DailyCallStatus = 'idle' | 'joining' | 'joined' | 'left' | 'error';

export type UseDailyCallOptions = {
  bookingId: string;
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

/** Rooms use enforce_unique_user_ids — reuse one call object; mint a fresh token before each join. */
let activeBookingId: string | null = null;
let activeJoinUrl: string | null = null;
let dailyTeardown: Promise<void> = Promise.resolve();

function isJoinedState(state: DailyMeetingState): boolean {
  return state === 'joined-meeting';
}

function shouldLeaveBeforeJoin(state: DailyMeetingState): boolean {
  return state !== 'new' && state !== 'loading' && state !== 'loaded';
}

async function fetchFreshJoinUrl(bookingId: string): Promise<string> {
  const res = await fetch(`/api/session/${bookingId}/join-url`, { cache: 'no-store' });
  const data = (await res.json()) as { joinUrl?: string; error?: string };
  if (!res.ok || !data.joinUrl) {
    throw new Error(data.error ?? 'Could not get meeting join link');
  }
  return data.joinUrl;
}

function scheduleDailyDestroy(call: DailyCall): Promise<void> {
  dailyTeardown = dailyTeardown.then(async () => {
    try {
      await call.destroy();
    } catch {
      // Instance may already be destroyed during rapid remounts.
    }
  });
  return dailyTeardown;
}

function acquireCallObject(): DailyCall {
  const existing = Daily.getCallInstance();
  if (existing && !existing.isDestroyed()) {
    return existing;
  }
  return Daily.createCallObject({
    subscribeToTracksAutomatically: true,
  });
}

function destroyCallOnPageHide(): void {
  const call = Daily.getCallInstance();
  if (call && !call.isDestroyed()) {
    void scheduleDailyDestroy(call);
  }
  activeBookingId = null;
  activeJoinUrl = null;
}

const MULTI_TRANSCRIPTION_CONFIG = {
  language: 'multi',
  model: 'nova-3',
  includeRawResponse: true,
  punctuate: true,
} as const;

const FALLBACK_TRANSCRIPTION_CONFIG = {
  language: 'en',
  punctuate: true,
} as const;

function isBenignTranscriptionError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return lower.includes('already') && (lower.includes('transcri') || lower.includes('running'));
}

function startOwnerTranscription(
  call: DailyCall,
  enabled: boolean,
  owner: boolean,
  transcriptionStarted: { current: boolean },
  onUnavailable: () => void,
): void {
  if (!enabled || !owner || transcriptionStarted.current) {
    return;
  }
  transcriptionStarted.current = true;
  try {
    call.startTranscription(MULTI_TRANSCRIPTION_CONFIG);
  } catch (err: unknown) {
    console.warn('[daily] startTranscription multi failed, trying en fallback', err);
    try {
      call.startTranscription(FALLBACK_TRANSCRIPTION_CONFIG);
    } catch (fallbackErr: unknown) {
      console.warn('[daily] startTranscription fallback failed', fallbackErr);
      onUnavailable();
    }
  }
}

function participantsMapFromDaily(call: DailyCall): DailyParticipantsMap {
  const raw = call.participants();
  const map: DailyParticipantsMap = {};
  for (const [key, participant] of Object.entries(raw)) {
    map[key] = {
      session_id: participant.session_id,
      user_id: participant.user_id,
    };
  }
  return map;
}

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
    bookingId,
    isOwner,
    transcriptionEnabled,
    e2eCaptionsStub = false,
    onFinalTranscription,
    onLeftMeeting,
  } = options;

  const callRef = useRef<DailyCall | null>(null);
  const hasJoinedRef = useRef(false);
  const seenSegmentsRef = useRef<Set<string>>(new Set());
  const onFinalRef = useRef(onFinalTranscription);
  const onLeftRef = useRef(onLeftMeeting);

  const [status, setStatus] = useState<DailyCallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantMedia[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [transcriptionUnavailable, setTranscriptionUnavailable] = useState(false);
  const transcriptionRetriedRef = useRef(false);
  const transcriptionStartedRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinalTranscription;
  }, [onFinalTranscription]);

  useEffect(() => {
    onLeftRef.current = onLeftMeeting;
  }, [onLeftMeeting]);

  useEffect(() => {
    window.addEventListener('pagehide', destroyCallOnPageHide);
    return () => window.removeEventListener('pagehide', destroyCallOnPageHide);
  }, []);

  const refreshParticipants = useCallback((callObject: DailyCall) => {
    const all = callObject.participants();
    const list = Object.values(all).map(participantMediaFromDaily);
    setParticipants(list);
  }, []);

  const handleTranscription = useCallback((event?: DailyEventObject<'transcription-message'>) => {
    const call = callRef.current;
    const payload = (event ?? {}) as DailyTranscriptionMessagePayload;
    const utterance = parseTranscriptionMessage(payload, { requireFinal: true });
    if (!utterance) {
      return;
    }

    const participants = call ? participantsMapFromDaily(call) : null;
    const resolvedSpeakerId = resolveSpeakerUserId(participants, payload.participantId);
    const resolved: TranscriptUtterance = {
      ...utterance,
      speakerId:
        resolvedSpeakerId !== 'unknown' ? resolvedSpeakerId : utterance.speakerId,
    };

    const dedupeKey = transcriptionDedupeKey(resolved);
    if (seenSegmentsRef.current.has(dedupeKey)) {
      return;
    }
    seenSegmentsRef.current.add(dedupeKey);
    onFinalRef.current?.(resolved);
  }, []);

  const handleTranscriptionError = useCallback(
    (event?: DailyEventObject<'transcription-error'>) => {
      const call = callRef.current;
      if (isBenignTranscriptionError(event?.errorMsg)) {
        transcriptionStartedRef.current = true;
        return;
      }
      if (!call || transcriptionRetriedRef.current) {
        setTranscriptionUnavailable(true);
        return;
      }
      transcriptionRetriedRef.current = true;
      console.warn('[daily] transcription-error, retrying with en fallback', event?.errorMsg);
      try {
        call.startTranscription(FALLBACK_TRANSCRIPTION_CONFIG);
      } catch (err: unknown) {
        console.warn('[daily] transcription fallback after error failed', err);
        setTranscriptionUnavailable(true);
      }
    },
    [],
  );

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

    if (!bookingId) {
      return;
    }

    let cancelled = false;
    let callObject: DailyCall | null = null;
    hasJoinedRef.current = false;
    transcriptionRetriedRef.current = false;
    transcriptionStartedRef.current = false;

    const onJoined = () => {
      if (cancelled || !callObject) {
        return;
      }
      hasJoinedRef.current = true;
      setStatus('joined');
      refreshParticipants(callObject);

      startOwnerTranscription(callObject, transcriptionEnabled, isOwner, transcriptionStartedRef, () => {
        setTranscriptionUnavailable(true);
      });
    };

    const onLeft = () => {
      if (cancelled) {
        return;
      }
      setStatus('left');
      if (hasJoinedRef.current) {
        onLeftRef.current?.();
      }
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

    const onParticipantChange = () => {
      if (callObject) {
        refreshParticipants(callObject);
      }
    };

    const detachListeners = (call: DailyCall) => {
      call.off('joined-meeting', onJoined);
      call.off('left-meeting', onLeft);
      call.off('error', onError);
      call.off('participant-joined', onParticipantChange);
      call.off('participant-updated', onParticipantChange);
      call.off('participant-left', onParticipantChange);
      call.off('track-started', onParticipantChange);
      call.off('track-stopped', onParticipantChange);
      call.off('transcription-message', handleTranscription);
      call.off('transcription-error', handleTranscriptionError);
    };

    void (async () => {
      try {
        if (cancelled) {
          return;
        }

        callObject = acquireCallObject();
        callRef.current = callObject;

        callObject.on('joined-meeting', onJoined);
        callObject.on('left-meeting', onLeft);
        callObject.on('error', onError);
        callObject.on('participant-joined', onParticipantChange);
        callObject.on('participant-updated', onParticipantChange);
        callObject.on('participant-left', onParticipantChange);
        callObject.on('track-started', onParticipantChange);
        callObject.on('track-stopped', onParticipantChange);
        callObject.on('transcription-message', handleTranscription);
        callObject.on('transcription-error', handleTranscriptionError);

        const meetingState = callObject.meetingState();
        if (
          activeBookingId === bookingId &&
          activeJoinUrl &&
          isJoinedState(meetingState)
        ) {
          hasJoinedRef.current = true;
          setStatus('joined');
          refreshParticipants(callObject);
          startOwnerTranscription(
            callObject,
            transcriptionEnabled,
            isOwner,
            transcriptionStartedRef,
            () => {
              setTranscriptionUnavailable(true);
            },
          );
          return;
        }

        if (shouldLeaveBeforeJoin(meetingState)) {
          await callObject.leave();
        }

        const joinUrl = await fetchFreshJoinUrl(bookingId);
        if (cancelled) {
          return;
        }

        activeBookingId = bookingId;
        activeJoinUrl = joinUrl;
        setStatus('joining');
        const { url, token } = splitDailyJoinUrl(joinUrl);
        await callObject.join(token ? { url, token } : { url });
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to join call');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      const call = callObject ?? callRef.current ?? Daily.getCallInstance() ?? null;
      if (call) {
        detachListeners(call);
      }
      callRef.current = null;
    };
  }, [
    bookingId,
    isOwner,
    transcriptionEnabled,
    e2eCaptionsStub,
    handleTranscription,
    handleTranscriptionError,
    refreshParticipants,
  ]);

  const leave = useCallback(async () => {
    const call = callRef.current ?? Daily.getCallInstance() ?? null;
    if (!call) {
      setStatus('left');
      onLeftRef.current?.();
      return;
    }
    await call.leave();
    await scheduleDailyDestroy(call);
    activeBookingId = null;
    activeJoinUrl = null;
    hasJoinedRef.current = false;
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
    transcriptionUnavailable,
  };
}
