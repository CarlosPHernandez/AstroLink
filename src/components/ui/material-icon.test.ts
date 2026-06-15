import { describe, expect, it } from 'vitest';
import { hasMaterialIconSvg } from './material-icon';

describe('hasMaterialIconSvg', () => {
  it('includes hero LCP icons as inline SVG', () => {
    expect(hasMaterialIconSvg('chat_bubble')).toBe(true);
    expect(hasMaterialIconSvg('videocam')).toBe(true);
    expect(hasMaterialIconSvg('play_circle')).toBe(true);
  });

  it('returns false for unknown icon names', () => {
    expect(hasMaterialIconSvg('unknown_icon_xyz')).toBe(false);
  });
});