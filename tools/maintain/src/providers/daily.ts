import {
  getDeclaredVersion,
  getInstalledVersion,
  searchFiles,
} from '../core/repo.js';
import type { ProviderModule } from '../core/types.js';

const PACKAGE = '@daily-co/daily-js';

export const dailyProvider: ProviderModule = {
  id: 'daily',
  displayName: 'Daily.co',

  async detectUsage(repoRoot) {
    const hits = searchFiles(
      repoRoot,
      [/@daily-co\/daily-js/, /DAILY_/, /daily\.co|createRoom|transcription/i],
      { includeDirs: ['src', 'docs'], maxHits: 80 },
    );
    return {
      provider: 'daily',
      packageName: PACKAGE,
      declaredVersion: getDeclaredVersion(repoRoot, PACKAGE),
      installedVersion: getInstalledVersion(repoRoot, PACKAGE),
      latestVersion: null,
      models: [],
      apiPatterns: ['daily-js client', 'REST rooms/transcription (server)'],
      files: [...new Set(hits.map((h) => h.path))].sort(),
      excerpts: [],
      envKeys: ['DAILY_API_KEY', 'DAILY_DOMAIN', 'DAILY_TRANSCRIPTION_ENABLED'],
      notes: [
        'v0 stub. Video sessions + transcription storage are production-critical; migrate carefully.',
        'See docs/explanation/daily-transcription-storage-incident.md before changing Daily flags.',
      ],
    };
  },

  async fetchLatest(usage) {
    let latestVersion: string | null = null;
    try {
      const res = await fetch('https://registry.npmjs.org/@daily-co/daily-js/latest');
      if (res.ok) {
        const body = (await res.json()) as { version?: string };
        latestVersion = body.version ?? null;
      }
    } catch {
      // ignore
    }
    return {
      latestVersion,
      releaseNotesDigest: `Installed ${usage.installedVersion}; latest ${latestVersion}. Full daily migrate not in v0.`,
      sourceUrls: ['https://docs.daily.co/changelog', 'https://github.com/daily-co/daily-js/releases'],
    };
  },

  quickSignals(usage, latest) {
    if (usage.installedVersion && latest && usage.installedVersion !== latest) {
      return [
        {
          kind: 'sdk_upgrade',
          title: `daily-js ${usage.installedVersion} → ${latest}`,
          summary: 'Version lag. Migrate path not implemented in v0.',
          impact: 'Session join UX / media APIs may shift.',
          risk: 'high',
          action: 'Manual review — video path is customer-facing.',
          sourceUrls: [],
        },
      ];
    }
    return [];
  },
};
