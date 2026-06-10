import { describe, expect, it } from 'vitest';
import {
  EXPERT_BIO_PREVIEW_MAX_CHARS,
  getBioPreview,
  isBioLong,
} from './expert-bio';

describe('expert-bio', () => {
  it('treats bios at or below the limit as short', () => {
    const short = 'a'.repeat(EXPERT_BIO_PREVIEW_MAX_CHARS);
    expect(isBioLong(short)).toBe(false);
    expect(getBioPreview(short)).toBe(short);
  });

  it('truncates long bios at a word boundary with ellipsis', () => {
    const long = `${'word '.repeat(80)}tail`;
    expect(isBioLong(long)).toBe(true);
    const preview = getBioPreview(long);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThan(long.length);
  });
});
