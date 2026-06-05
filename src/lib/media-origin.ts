export type MediaOriginSnapshot = {
  readonly insecure: boolean;
  readonly httpsOrigin: string;
};

/** SSR / hydration fallback for useSyncExternalStore getServerSnapshot. */
export const MEDIA_ORIGIN_SERVER_SNAPSHOT: MediaOriginSnapshot = {
  insecure: false,
  httpsOrigin: 'https://localhost:3000',
};

let clientSnapshotCache: MediaOriginSnapshot = MEDIA_ORIGIN_SERVER_SNAPSHOT;
let clientSnapshotKey = '';

/**
 * Cached snapshot for useSyncExternalStore — must return the same object reference
 * until insecure/httpsOrigin values actually change.
 */
export function getMediaOriginSnapshot(): MediaOriginSnapshot {
  if (typeof window === 'undefined') {
    return MEDIA_ORIGIN_SERVER_SNAPSHOT;
  }
  const insecure = isInsecureMediaOrigin();
  const httpsOrigin = buildHttpsDevOrigin();
  const key = `${insecure}\0${httpsOrigin}`;
  if (key === clientSnapshotKey) {
    return clientSnapshotCache;
  }
  clientSnapshotKey = key;
  clientSnapshotCache = { insecure, httpsOrigin };
  return clientSnapshotCache;
}

/** Page origin is fixed for a document lifetime; no live updates to subscribe to. */
export function subscribeMediaOrigin(_onStoreChange: () => void): () => void {
  return () => {};
}

/** True when camera/mic are blocked (plain HTTP on a non-localhost host). */
export function isInsecureMediaOrigin(
  location: Pick<Location, 'protocol' | 'hostname'> = typeof window !== 'undefined'
    ? window.location
    : { protocol: 'https:', hostname: 'localhost' },
): boolean {
  if (location.protocol !== 'http:') {
    return false;
  }
  return location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
}

/** Same host/port as the current page, switched to HTTPS (for dev:lan on a phone). */
export function buildHttpsDevOrigin(
  location: Pick<Location, 'hostname' | 'port'> = typeof window !== 'undefined'
    ? window.location
    : { hostname: 'localhost', port: '3000' },
): string {
  const portSuffix = location.port ? `:${location.port}` : '';
  return `https://${location.hostname}${portSuffix}`;
}
