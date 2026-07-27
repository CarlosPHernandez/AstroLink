import {
  getDeclaredVersion,
  getInstalledVersion,
  readFileExcerpt,
  searchFiles,
} from '../core/repo.js';
import type { MaterialChange, ProviderModule, UsageSnapshot } from '../core/types.js';

const PACKAGE = 'openai';

const MODEL_RE =
  /\b(gpt-4o(?:-mini)?|gpt-4\.1(?:-mini|-nano)?|gpt-4-turbo|gpt-3\.5-turbo|o[134](?:-mini)?|chatgpt-4o-latest|gpt-5(?:-mini|-nano)?)\b/g;

export const openaiProvider: ProviderModule = {
  id: 'openai',
  displayName: 'OpenAI',

  async detectUsage(repoRoot) {
    const declaredVersion = getDeclaredVersion(repoRoot, PACKAGE);
    const installedVersion = getInstalledVersion(repoRoot, PACKAGE);

    const importHits = searchFiles(
      repoRoot,
      [
        /from ['"]openai['"]/,
        /require\(['"]openai['"]\)/,
        /OPENAI_/,
        /LLM_PROVIDER/,
        /gpt-4o/,
        /chat\.completions/,
        /response_format/,
        /responses\.create/,
      ],
      {
        includeDirs: ['src', 'docs', 'e2e', '.'],
        extensions: ['.ts', '.tsx', '.js', '.mjs', '.md', '.example'],
        maxHits: 150,
      },
    );

    // Also scan package.json and .env.example at root
    const rootHits = searchFiles(repoRoot, [/openai|OPENAI_|gpt-4/], {
      includeDirs: ['.'],
      extensions: ['.json', '.example', '.md'],
      maxHits: 40,
    }).filter((h) => !h.path.startsWith('node_modules') && !h.path.startsWith('tools/'));

    const allHits = [...importHits, ...rootHits];
    const fileSet = new Set(allHits.map((h) => h.path));

    // Prefer core integration files first
    const priority = [
      'src/lib/llm.ts',
      'src/lib/llm-audit.ts',
      'src/lib/llm.test.ts',
      'package.json',
      '.env.example',
      'docs/how-to/ai-brief-gemini-to-openai-switch.md',
    ];
    for (const p of priority) fileSet.add(p);

    const files = [...fileSet].filter((f) => !f.includes('node_modules')).sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });

    const models = new Set<string>();
    const apiPatterns = new Set<string>();
    const envKeys = new Set<string>();

    for (const hit of allHits) {
      const m = hit.text.matchAll(MODEL_RE);
      for (const match of m) models.add(match[1]);
      if (/OPENAI_[A-Z0-9_]+/.test(hit.text)) {
        for (const env of hit.text.match(/OPENAI_[A-Z0-9_]+/g) ?? []) envKeys.add(env);
      }
      if (hit.text.includes('LLM_PROVIDER')) envKeys.add('LLM_PROVIDER');
      if (hit.text.includes('chat.completions')) apiPatterns.add('chat.completions.create');
      if (hit.text.includes('response_format')) apiPatterns.add('response_format.json_schema');
      if (hit.text.includes('responses.create')) apiPatterns.add('responses.create');
      if (hit.text.includes('images.generate')) apiPatterns.add('images.generate');
    }

    // Defaults from llm.ts if not found in line scan
    if (!models.size) {
      models.add('gpt-4o-mini');
      models.add('gpt-4o');
    }

    const excerptPaths = ['src/lib/llm.ts', 'src/lib/llm-audit.ts', '.env.example'];
    const excerpts: UsageSnapshot['excerpts'] = [];
    for (const p of excerptPaths) {
      const content = readFileExcerpt(repoRoot, p, 8000);
      if (content) {
        excerpts.push({ path: p, content });
        // Patterns often sit on lines without OPENAI_ env tokens — scan full file.
        if (content.includes('chat.completions')) apiPatterns.add('chat.completions.create');
        if (content.includes('response_format')) apiPatterns.add('response_format.json_schema');
        if (content.includes('responses.create')) apiPatterns.add('responses.create');
        if (content.includes("type: 'file'") || content.includes('type: "file"')) {
          apiPatterns.add('chat.completions.file_content_parts');
        }
        if (content.includes('json_schema')) apiPatterns.add('json_schema.strict');
      }
    }

    // Detect call sites that go through llm abstraction
    const agentHits = searchFiles(
      repoRoot,
      [/generateStructuredJson|generatePlainText|llmFlashModel|llmProModel|callLlmWithBackoff/],
      { includeDirs: ['src'], maxHits: 80 },
    );
    for (const h of agentHits) fileSet.add(h.path);

    const notes = [
      'OpenAI is accessed almost exclusively via src/lib/llm.ts (chat.completions + json_schema structured output).',
      'Provider selection: LLM_PROVIDER env, else OPENAI_API_KEY present → openai, else gemini.',
      'Default models: OPENAI_FLASH_MODEL||gpt-4o-mini, OPENAI_PRO_MODEL||gpt-4o.',
      'Consumers: briefing, booking match, compliance, session recap, translation/captions agents.',
      'E2E stubs when E2E_STUB_LLM=true (no live OpenAI in Playwright).',
      `LLM call sites (via abstraction): ${[...new Set(agentHits.map((h) => h.path))].slice(0, 12).join(', ') || 'none'}`,
    ];

    return {
      provider: 'openai',
      packageName: PACKAGE,
      declaredVersion,
      installedVersion,
      latestVersion: null,
      models: [...models].sort(),
      apiPatterns: [...apiPatterns].sort(),
      files: [...fileSet].filter((f) => !f.startsWith('node_modules')).sort(),
      excerpts,
      envKeys: [...envKeys].sort(),
      notes,
    };
  },

  async fetchLatest(usage) {
    const sourceUrls: string[] = [
      'https://www.npmjs.com/package/openai',
      'https://github.com/openai/openai-node/releases',
      'https://platform.openai.com/docs/models',
      'https://platform.openai.com/docs/guides/your-data',
    ];

    let latestVersion: string | null = null;
    let releaseNotesDigest = '';

    // npm registry
    try {
      const npmRes = await fetch('https://registry.npmjs.org/openai/latest', {
        headers: { Accept: 'application/json' },
      });
      if (npmRes.ok) {
        const body = (await npmRes.json()) as { version?: string };
        latestVersion = body.version ?? null;
        if (latestVersion) {
          sourceUrls.unshift(`https://www.npmjs.com/package/openai/v/${latestVersion}`);
        }
      }
    } catch (e) {
      releaseNotesDigest += `npm registry fetch failed: ${e instanceof Error ? e.message : e}\n`;
    }

    // GitHub releases (public API, no auth)
    try {
      const ghRes = await fetch(
        'https://api.github.com/repos/openai/openai-node/releases?per_page=8',
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'astro-maintain',
          },
        },
      );
      if (ghRes.ok) {
        const releases = (await ghRes.json()) as Array<{
          tag_name: string;
          name: string;
          body: string;
          published_at: string;
          html_url: string;
        }>;
        const parts: string[] = [
          `Installed: ${usage.installedVersion ?? 'unknown'}`,
          `Latest npm: ${latestVersion ?? 'unknown'}`,
          ``,
          `## openai-node recent releases`,
        ];
        for (const r of releases) {
          sourceUrls.push(r.html_url);
          const body = (r.body || '').slice(0, 1500);
          parts.push(`### ${r.tag_name} — ${r.name} (${r.published_at})`);
          parts.push(body || '_No body_');
          parts.push('');
        }
        releaseNotesDigest += parts.join('\n');
      } else {
        releaseNotesDigest += `GitHub releases HTTP ${ghRes.status}\n`;
      }
    } catch (e) {
      releaseNotesDigest += `GitHub releases fetch failed: ${e instanceof Error ? e.message : e}\n`;
    }

    // Model deprecation hints (static knowledge + models used)
    releaseNotesDigest += [
      ``,
      `## Models currently referenced in AstroLink`,
      ...usage.models.map((m) => `- ${m}`),
      ``,
      `## API surface in use`,
      ...usage.apiPatterns.map((p) => `- ${p}`),
      ``,
      `Note: Chat Completions remain supported; Responses API is the newer preferred API for many apps but is NOT required unless we choose to migrate.`,
      `Watch for model deprecations of gpt-4o / gpt-4o-mini and structured outputs / json_schema changes.`,
    ].join('\n');

    return { latestVersion, releaseNotesDigest, sourceUrls: [...new Set(sourceUrls)] };
  },

  quickSignals(usage, latestVersion) {
    const changes: MaterialChange[] = [];
    const latest = latestVersion ?? usage.latestVersion;

    if (usage.installedVersion && latest && usage.installedVersion !== latest) {
      changes.push({
        kind: 'sdk_upgrade',
        title: `openai SDK ${usage.installedVersion} → ${latest}`,
        summary: `Root package depends on ${usage.declaredVersion}; installed ${usage.installedVersion}; npm latest is ${latest}.`,
        impact:
          'May include bugfixes or type changes around chat.completions / structured outputs used by src/lib/llm.ts.',
        risk: 'low',
        action: 'Run migrate openai (or bump openai in package.json and npm install), then run llm unit tests.',
        sourceUrls: ['https://github.com/openai/openai-node/releases'],
      });
    }

    // Soft signal: models that are often superseded
    const legacy = usage.models.filter((m) => m === 'gpt-3.5-turbo' || m === 'gpt-4-turbo');
    if (legacy.length) {
      changes.push({
        kind: 'model_deprecation',
        title: `Legacy model IDs in use: ${legacy.join(', ')}`,
        summary: 'These models are older and may face higher cost or deprecation vs gpt-4o family.',
        impact: 'Briefing/matching quality and pricing if env overrides point at legacy models.',
        risk: 'medium',
        action: 'Align OPENAI_FLASH_MODEL / OPENAI_PRO_MODEL with current OpenAI recommended models.',
        sourceUrls: ['https://platform.openai.com/docs/models'],
      });
    }

    if (
      usage.files.some((f) => f.endsWith('src/lib/llm.ts') || f === 'src/lib/llm.ts') &&
      !usage.apiPatterns.some((p) => p.includes('chat.completions'))
    ) {
      changes.push({
        kind: 'api_shape',
        title: 'Could not detect chat.completions usage in llm.ts',
        summary: 'Expected primary path may have moved; re-scan src/lib/llm.ts.',
        impact: 'Detection gap — verify manually before relying on migrate.',
        risk: 'low',
        action: 'Open src/lib/llm.ts and confirm API surface.',
        sourceUrls: [],
      });
    }

    return changes;
  },
};
