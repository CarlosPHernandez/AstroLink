import { describe, expect, it } from 'vitest';
import {
  buildHttpsDevOrigin,
  getMediaOriginSnapshot,
  isInsecureMediaOrigin,
} from './media-origin';

describe('isInsecureMediaOrigin', () => {
  it('flags plain HTTP on a LAN IP', () => {
    expect(isInsecureMediaOrigin({ protocol: 'http:', hostname: '192.168.1.13' })).toBe(true);
  });

  it('allows localhost and 127.0.0.1 over HTTP', () => {
    expect(isInsecureMediaOrigin({ protocol: 'http:', hostname: 'localhost' })).toBe(false);
    expect(isInsecureMediaOrigin({ protocol: 'http:', hostname: '127.0.0.1' })).toBe(false);
  });

  it('allows HTTPS on any host', () => {
    expect(isInsecureMediaOrigin({ protocol: 'https:', hostname: '192.168.1.13' })).toBe(false);
  });
});

describe('buildHttpsDevOrigin', () => {
  it('preserves hostname and port', () => {
    expect(buildHttpsDevOrigin({ hostname: '192.168.1.13', port: '3000' })).toBe(
      'https://192.168.1.13:3000',
    );
  });
});

describe('getMediaOriginSnapshot', () => {
  it('returns a stable object reference across repeated calls', () => {
    const first = getMediaOriginSnapshot();
    const second = getMediaOriginSnapshot();
    expect(second).toBe(first);
  });
});
