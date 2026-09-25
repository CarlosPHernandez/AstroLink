'use client';

import { useState } from 'react';

import { ExpertInitials } from '@/components/experts/expert-initials';
import { FormAlert } from '@/components/forms/form-alert';
import { PORTRAIT_MAX_BYTES } from '@/lib/expert-profile-media';

const PORTRAIT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const INTRO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

async function uploadMedia(kind: 'portrait' | 'intro', file: File): Promise<string> {
  const contentType = file.type;
  const allowed = kind === 'portrait' ? PORTRAIT_TYPES : INTRO_TYPES;
  if (!allowed.includes(contentType)) {
    throw new Error(
      kind === 'portrait'
        ? 'Use a JPG, PNG, or WEBP photo.'
        : 'Use an MP4, WEBM, or MOV video.',
    );
  }
  if (kind === 'portrait' && file.size > PORTRAIT_MAX_BYTES) {
    throw new Error('Photo must be 5 MB or smaller.');
  }

  const urlRes = await fetch('/api/mentor/profile-media/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, contentType }),
  });
  const urlData = (await urlRes.json()) as {
    success?: boolean;
    path?: string;
    signedUrl?: string;
    error?: string;
  };
  if (!urlRes.ok || !urlData.signedUrl || !urlData.path) {
    throw new Error(urlData.error ?? 'Could not start the upload.');
  }

  const put = await fetch(urlData.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!put.ok) {
    throw new Error('Upload failed. Try again.');
  }

  const done = await fetch('/api/mentor/profile-media/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, path: urlData.path }),
  });
  const saved = (await done.json()) as {
    success?: boolean;
    imageUrl?: string;
    introVideoUrl?: string;
    error?: string;
  };
  if (!done.ok || !saved.success) {
    throw new Error(saved.error ?? 'Could not save your profile media.');
  }
  const next = kind === 'portrait' ? saved.imageUrl : saved.introVideoUrl;
  if (!next) throw new Error('Could not save your profile media.');
  return next;
}

export function MentorProfileMediaPanel({
  fullName,
  imageUrl,
  introVideoUrl,
}: {
  fullName: string;
  imageUrl: string | null;
  introVideoUrl: string | null;
}) {
  const [photo, setPhoto] = useState(imageUrl);
  const [video, setVideo] = useState(introVideoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);

  return (
    <div className="md-settings-fields" data-testid="mentor-settings-media">
      <div className="md-settings-field">
        <p className="md-settings-section-label">Portrait</p>
        <div className="md-settings-portrait" data-testid="mentor-settings-portrait">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- expert-supplied storage URL, swapped after save
            <img src={photo} alt="" />
          ) : (
            <ExpertInitials name={fullName} className="text-2xl" />
          )}
        </div>
        <label htmlFor="mentor-settings-photo">Photo</label>
        <input
          id="mentor-settings-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="md-settings-input"
          data-testid="mentor-settings-photo-input"
          onChange={(event) => {
            setPhotoFile(event.target.files?.[0] ?? null);
            setPhotoError(null);
          }}
        />
        <p className="md-settings-hint">JPG, PNG, or WEBP. Up to 5 MB.</p>
        {photoError ? <FormAlert message={photoError} /> : null}
        <button
          type="button"
          className="md-settings-btn"
          disabled={photoBusy || !photoFile}
          data-testid="mentor-settings-photo-save"
          onClick={() => {
            if (!photoFile) return;
            setPhotoBusy(true);
            setPhotoError(null);
            void uploadMedia('portrait', photoFile)
              .then((url) => setPhoto(url))
              .catch((error: unknown) => {
                setPhotoError(error instanceof Error ? error.message : 'Could not save your photo.');
              })
              .finally(() => setPhotoBusy(false));
          }}
        >
          {photoBusy ? 'Saving…' : 'Save photo'}
        </button>
      </div>

      <div className="md-settings-field">
        <p className="md-settings-section-label">Intro video</p>
        {video ? (
          <video
            key={video}
            src={video}
            controls
            playsInline
            className="md-settings-video"
            data-testid="mentor-settings-video"
          />
        ) : (
          <p className="md-settings-hint" data-testid="mentor-settings-video-empty">
            You have not added a video yet.
          </p>
        )}
        <label htmlFor="mentor-settings-video-file">Video</label>
        <input
          id="mentor-settings-video-file"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="md-settings-input"
          data-testid="mentor-settings-video-input"
          onChange={(event) => {
            setVideoFile(event.target.files?.[0] ?? null);
            setVideoError(null);
          }}
        />
        <p className="md-settings-hint">MP4, WEBM, or MOV. Up to 100 MB.</p>
        {videoError ? <FormAlert message={videoError} /> : null}
        <button
          type="button"
          className="md-settings-btn"
          disabled={videoBusy || !videoFile}
          data-testid="mentor-settings-video-save"
          onClick={() => {
            if (!videoFile) return;
            setVideoBusy(true);
            setVideoError(null);
            void uploadMedia('intro', videoFile)
              .then((url) => setVideo(url))
              .catch((error: unknown) => {
                setVideoError(error instanceof Error ? error.message : 'Could not save your video.');
              })
              .finally(() => setVideoBusy(false));
          }}
        >
          {videoBusy ? 'Saving…' : 'Save video'}
        </button>
      </div>
    </div>
  );
}
