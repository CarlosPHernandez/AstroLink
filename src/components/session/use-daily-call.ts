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
  /** Join muted with AstroLink logo as the published video (ops observer). */
  logoAvatarMode?: boolean;
  transcriptionEnabled: boolean;
  e2eCaptionsStub?: boolean;
  onFinalTranscription?: (utterance: TranscriptUtterance) => void;
  onLeftMeeting?: () => void;
};

/** Still image of /logo.jpg published as a low-fps video track so remotes see branding. */
async function createAstrolinkLogoVideoTrack(): Promise<MediaStreamTrack> {
  const img = new Image();
  img.decoding = 'async';
  img.src = '/logo.jpg';
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create logo canvas');
  }
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const maxW = canvas.width * 0.55;
  const maxH = canvas.height * 0.5;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

  const stream = canvas.captureStream(5);
  const track = stream.getVideoTracks()[0];
  if (!track) {
    throw new Error('Logo captureStream produced no video track');
  }
  return track;
}

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

const MAX_SEEN_SEGMENT_KEYS = 200;

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
    console.warn('[daily] startTranscription multi failed, retrying multi', err);
    try {
      call.startTranscription(MULTI_TRANSCRIPTION_CONFIG);
    } catch (retryErr: unknown) {
      console.warn('[daily] startTranscription multi retry failed', retryErr);
      transcriptionStarted.current = false;
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
    logoAvatarMode = false,
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
  const logoTrackRef = useRef<MediaStreamTrack | null>(null);

  const [status, setStatus] = useState<DailyCallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantMedia[]>([]);
  const [micEnabled, setMicEnabled] = useState(!logoAvatarMode);
  const [cameraEnabled, setCameraEnabled] = useState(!logoAvatarMode);
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
    if (seenSegmentsRef.current.size > MAX_SEEN_SEGMENT_KEYS) {
      const first = seenSegmentsRef.current.values().next().value;
      if (first) {
        seenSegmentsRef.current.delete(first);
      }
    }
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
      console.warn('[daily] transcription-error, retrying multi language STT', event?.errorMsg);
      try {
        call.startTranscription(MULTI_TRANSCRIPTION_CONFIG);
      } catch (err: unknown) {
        console.warn('[daily] transcription multi retry after error failed', err);
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
      const frame = window.requestAnimationFrame(() => setStatus('joined'));
      return () => {
        window.cancelAnimationFrame(frame);
        delete w.__ASTROLINK_E2E_CAPTIONS__;
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

      if (logoAvatarMode) {
        void (async () => {
          try {
            await callObject.setLocalAudio(false);
            setMicEnabled(false);
            const logoTrack = await createAstrolinkLogoVideoTrack();
            if (cancelled || callObject.isDestroyed()) {
              logoTrack.stop();
              return;
            }
            logoTrackRef.current?.stop();
            logoTrackRef.current = logoTrack;
            await callObject.setInputDevicesAsync({ videoSource: logoTrack });
            await callObject.setLocalVideo(true);
            setCameraEnabled(true);
            refreshParticipants(callObject);
          } catch (logoErr: unknown) {
            console.warn('[daily] logo avatar mode failed; staying camera-off', logoErr);
            try {
              await callObject.setLocalVideo(false);
              await callObject.setLocalAudio(false);
            } catch {
              // ignore
            }
            setCameraEnabled(false);
            setMicEnabled(false);
          }
        })();
      }

      // Observer should not start domain transcription as owner.
      if (!logoAvatarMode) {
        startOwnerTranscription(
          callObject,
          transcriptionEnabled,
          isOwner,
          transcriptionStartedRef,
          () => {
            setTranscriptionUnavailable(true);
          },
        );
      }
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
        await callObject.join(
          token
            ? {
                url,
                token,
                startVideoOff: logoAvatarMode,
                startAudioOff: logoAvatarMode,
              }
            : {
                url,
                startVideoOff: logoAvatarMode,
                startAudioOff: logoAvatarMode,
              },
        );
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
      logoTrackRef.current?.stop();
      logoTrackRef.current = null;
      const call = callObject ?? callRef.current ?? Daily.getCallInstance() ?? null;
      if (call) {
        detachListeners(call);
      }
      callRef.current = null;
    };
  }, [
    bookingId,
    isOwner,
    logoAvatarMode,
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
