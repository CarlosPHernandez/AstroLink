'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type ExpertIntroMediaProps = {
  name: string;
  imageUrl: string;
  introVideoUrl: string | null;
  className?: string;
  /** When true, video autoplays muted; image uses a subtle Ken Burns effect. */
  autoPlay?: boolean;
  priority?: boolean;
};

export function ExpertIntroMedia({
  name,
  imageUrl,
  introVideoUrl,
  className = '',
  autoPlay = true,
  priority = false,
}: ExpertIntroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = Boolean(introVideoUrl) && !videoFailed;

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || !autoPlay) return;
    void el.play().catch(() => {
      /* Autoplay blocked — user can tap play */
    });
  }, [autoPlay]);

  useEffect(() => {
    if (showVideo && videoReady) {
      tryPlay();
    }
  }, [showVideo, videoReady, tryPlay]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-outline-variant/60 bg-inverse-surface ${className}`}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            src={introVideoUrl!}
            poster={imageUrl}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            loop
            playsInline
            autoPlay={autoPlay}
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            aria-label={`Introduction video for ${name}`}
          />
          {!videoReady && (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
              priority={priority}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 expert-intro-ken-burns">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
            priority={priority}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

      {!showVideo && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-black/40 px-4 py-2.5 backdrop-blur-md">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">
            Intro portrait
          </span>
          <span className="material-symbols-outlined text-white/80 text-[20px]">person</span>
        </div>
      )}

      {showVideo && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-white">
            Playing intro
          </span>
        </div>
      )}
    </div>
  );
}
