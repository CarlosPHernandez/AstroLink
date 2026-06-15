'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toOptimizedImageUrl } from '@/lib/public-images';

type ExpertIntroMediaProps = {
  name: string;
  imageUrl: string;
  introVideoUrl: string | null;
  className?: string;
  priority?: boolean;
  /** Directory preview: muted autoplay on mount (browser policy requires muted). */
  autoPlayMuted?: boolean;
};

/**
 * Reusable hero media for expert profiles and directory preview.
 * - Profile default: explicit controls, poster from image, user-initiated play.
 * - Directory (`autoPlayMuted`): muted autoplay on mount with optional unmute.
 */
export function ExpertIntroMedia({
  name,
  imageUrl,
  introVideoUrl,
  className = '',
  priority = false,
  autoPlayMuted = false,
}: ExpertIntroMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(autoPlayMuted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(introVideoUrl) && !videoFailed;
  const optimizedImageUrl = useMemo(() => toOptimizedImageUrl(imageUrl), [imageUrl]);

  useEffect(() => {
    if (!autoPlayMuted || !showVideo || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => setVideoFailed(true));
  }, [autoPlayMuted, showVideo, introVideoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setVideoFailed(true));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm ${className}`}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            src={introVideoUrl!}
            poster={optimizedImageUrl}
            playsInline
            muted={muted}
            autoPlay={autoPlayMuted}
            loop={autoPlayMuted}
            className="absolute inset-0 h-full w-full object-cover"
            aria-label={`Introduction video for ${name}`}
            onError={() => setVideoFailed(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              if (!autoPlayMuted) setPlaying(false);
            }}
          />
          {autoPlayMuted ? (
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
              aria-label={muted ? 'Unmute introduction video' : 'Mute introduction video'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {muted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex flex-col items-center justify-center transition-colors group"
              style={{ background: playing ? 'transparent' : 'rgba(0,0,0,0.18)' }}
              aria-label={playing ? 'Pause introduction video' : 'Play introduction video'}
            >
              {!playing && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:scale-105 transition-transform">
                    <span
                      className="material-symbols-outlined text-[34px] text-black/80 ml-1"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg border border-white/20 bg-black/50 px-4 py-2 backdrop-blur-md">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">Watch intro</span>
                    <span className="material-symbols-outlined text-white/70 text-[16px]">videocam</span>
                  </div>
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <>
          <Image
            src={optimizedImageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-md">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">
              Intro portrait
            </span>
            <span className="material-symbols-outlined text-white/80 text-[20px]">person</span>
          </div>
        </>
      )}
    </div>
  );
}
