import { describe, expect, it } from 'vitest';
import { getExpertBookHref } from './expert-book-href';

describe('getExpertBookHref', () => {
  it('returns booking path when signed in', () => {
    expect(getExpertBookHref('chris-sembroski', true)).toBe(
      '/booking?mentor=chris-sembroski',
    );
  });

  it('returns auth redirect when signed out', () => {
    const href = getExpertBookHref('chris-sembroski', false);
    expect(href).toMatch(/^\/auth\?redirect=/);
    expect(decodeURIComponent(href.split('redirect=')[1] ?? '')).toBe(
      '/booking?mentor=chris-sembroski',
    );
  });

  it('encodes slug in query params', () => {
    expect(getExpertBookHref('name with spaces', true)).toBe(
      '/booking?mentor=name%20with%20spaces',
    );
  });
});
