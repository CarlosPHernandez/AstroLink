import { describe, expect, it } from 'vitest';
import {
  assertProfileMediaRateLimit,
  expertInitials,
  introHeaderOk,
  isExactOwnedMediaPath,
  mediaObjectPath,
  portraitHeaderOk,
  publicMediaUrl,
  resetProfileMediaRateLimit,
} from '@/lib/expert-profile-media';

describe('expert profile media paths', () => {
  it('builds a portrait path from the session slug, not a caller slug', () => {
    expect(mediaObjectPath('avery-quinn', 'portrait', 'image/jpeg')).toBe('avery-quinn/portrait.jpg');
    expect(mediaObjectPath('avery-quinn', 'intro', 'video/mp4')).toBe('avery-quinn/intro.mp4');
    expect(mediaObjectPath('../chris', 'portrait', 'image/jpeg')).toBeNull();
    expect(mediaObjectPath('avery-quinn', 'portrait', 'image/svg+xml')).toBeNull();
  });

  it('rejects another expert, traversal, and a client URL', () => {
    expect(isExactOwnedMediaPath('avery-quinn', 'portrait', 'other-slug/portrait.jpg')).toBe(false);
    expect(isExactOwnedMediaPath('avery-quinn', 'portrait', 'avery-quinn/../other/portrait.jpg')).toBe(false);
    expect(isExactOwnedMediaPath('avery-quinn', 'portrait', 'https://evil.example/avery-quinn/portrait.jpg')).toBe(
      false,
    );
    expect(isExactOwnedMediaPath('avery-quinn', 'portrait', 'avery-quinn/portrait.jpg')).toBe(true);
  });

  it('accepts real image and video headers', () => {
    expect(portraitHeaderOk(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(portraitHeaderOk(new Uint8Array([0x3c, 0x73, 0x76, 0x67]))).toBe(false);
    const ftyp = new Uint8Array(8);
    ftyp.set([0x66, 0x74, 0x79, 0x70], 4);
    expect(introHeaderOk(ftyp)).toBe(true);
    expect(introHeaderOk(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBe(false);
  });

  it('builds a cache-busted public URL', () => {
    expect(publicMediaUrl('https://example.com/portrait.jpg?old=1', 5)).toBe(
      'https://example.com/portrait.jpg?v=5',
    );
  });

  it('limits signed URLs per mentor', () => {
    resetProfileMediaRateLimit();
    for (let i = 0; i < 10; i += 1) assertProfileMediaRateLimit('mentor-1', 1_000);
    expect(() => assertProfileMediaRateLimit('mentor-1', 1_000)).toThrow(/Too many uploads/);
    expect(() => assertProfileMediaRateLimit('mentor-2', 1_000)).not.toThrow();
  });

  it('uses initials when there is no portrait', () => {
    expect(expertInitials('Avery Quinn')).toBe('AQ');
    expect(expertInitials('Chris')).toBe('CH');
  });
});
