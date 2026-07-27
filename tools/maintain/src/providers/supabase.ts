import {
  getDeclaredVersion,
  getInstalledVersion,
  searchFiles,
} from '../core/repo.js';
import type { ProviderModule } from '../core/types.js';

export const supabaseProvider: ProviderModule = {
  id: 'supabase',
  displayName: 'Supabase',

  async detectUsage(repoRoot) {
    const hits = searchFiles(
      repoRoot,
      [/@supabase\/supabase-js/, /@supabase\/ssr/, /SUPABASE_/],
      { includeDirs: ['src'], maxHits: 80 },
    );
    return {
      provider: 'supabase',
      packageName: '@supabase/supabase-js',
      declaredVersion: getDeclaredVersion(repoRoot, '@supabase/supabase-js'),
      installedVersion: getInstalledVersion(repoRoot, '@supabase/supabase-js'),
      latestVersion: null,
      models: [],
      apiPatterns: ['@supabase/ssr', '@supabase/supabase-js'],
      files: [...new Set(hits.map((h) => h.path))].sort(),
      excerpts: [],
      envKeys: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ],
      notes: [
        'v0 stub: detect versions only. Auth via @supabase/ssr; hosted project (no local stack).',
      ],
    };
  },

  async fetchLatest(usage) {
    let latestVersion: string | null = null;
    try {
      const res = await fetch('https://registry.npmjs.org/@supabase/supabase-js/latest');
      if (res.ok) {
        const body = (await res.json()) as { version?: string };
        latestVersion = body.version ?? null;
      }
    } catch {
      // ignore
    }
    return {
      latestVersion,
      releaseNotesDigest: `Installed ${usage.installedVersion}; latest ${latestVersion}. Full supabase migrate not in v0.`,
      sourceUrls: ['https://github.com/supabase/supabase-js/releases'],
    };
  },

  quickSignals(usage, latest) {
    if (usage.installedVersion && latest && usage.installedVersion !== latest) {
      return [
        {
          kind: 'sdk_upgrade',
          title: `@supabase/supabase-js ${usage.installedVersion} → ${latest}`,
          summary: 'Version lag. Migrate path not implemented in v0.',
          impact: 'Auth/session helpers may need review.',
          risk: 'medium',
          action: 'Manual review of @supabase/ssr changelog.',
          sourceUrls: [],
        },
      ];
    }
    return [];
  },
};
