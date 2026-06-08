'use client';

import Image from 'next/image';
import { useState } from 'react';

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
  const showVideo = Boolean(introVideoUrl) && !videoFailed;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm ${className}`}
    >
      {showVideo ? (
        <video
          src={introVideoUrl!}
          poster={imageUrl}
          controls
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
          aria-label={`Introduction video for ${name}`}
          onError={() => setVideoFailed(true)}
        />
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
