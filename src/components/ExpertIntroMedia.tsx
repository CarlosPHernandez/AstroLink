'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

type ExpertIntroMediaProps = {
  name: string;
  imageUrl: string;
  introVideoUrl: string | null;
  className?: string;
  priority?: boolean;
};

/**
 * Reusable hero media for expert profiles.
 * - Prefers intro video (explicit controls, poster from image).
 * - Graceful fallback to still image with premium treatment.
 * - Profile-tuned: no forced autoplay/loop/muted; user-initiated play.
 * Adapted from prior solid component + tailored for the new profile layout.
 */
export function ExpertIntroMedia({
  name,
  imageUrl,
  introVideoUrl,
  className = '',
  priority = false,
}: ExpertIntroMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(introVideoUrl) && !videoFailed;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setVideoFailed(true));
    }
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
            poster={imageUrl}
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-label={`Introduction video for ${name}`}
            onError={() => setVideoFailed(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          {/* Custom play / pause overlay */}
          <button
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
        </>
      ) : (
        <>
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
            priority={priority}
          />
          {/* Subtle premium overlay treatment when no video */}
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
