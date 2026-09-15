import { describe, expect, it } from 'vitest';
import { offerPublicPath } from '@/lib/expert-offers/path';

describe('offerPublicPath', () => {
  it('builds the canonical share path', () => {
    expect(offerPublicPath('eiman-jahangir', 'book-lessons-and-how-to-apply-them')).toBe(
      '/s/eiman-jahangir/book-lessons-and-how-to-apply-them',
    );
  });
});
