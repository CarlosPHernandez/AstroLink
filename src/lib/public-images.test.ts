import { describe, expect, it } from 'vitest';
import { DEFAULT_MENTOR_IMAGE, toOptimizedImageUrl } from '@/lib/public-images';

describe('toOptimizedImageUrl', () => {
  it('falls back to the default portrait when src is empty', () => {
    expect(toOptimizedImageUrl('')).toBe(DEFAULT_MENTOR_IMAGE);
    expect(toOptimizedImageUrl('   ')).toBe(DEFAULT_MENTOR_IMAGE);
  });

  it('rewrites local jpeg/png paths to webp', () => {
    expect(toOptimizedImageUrl('/experts/face.jpg')).toBe('/experts/face.webp');
  });
});
