import type { Metadata } from 'next';
import VideoWatchClient from './video-watch-client';

export const metadata: Metadata = {
  title: 'Your personal video · AstroLink',
  robots: { index: false, follow: false },
};

export default function VideoWatchPage() {
  return <VideoWatchClient />;
}
