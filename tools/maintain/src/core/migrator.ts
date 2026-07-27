import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ceoFromMigration } from './ceo.js';
import { completeJson, hasOpenAIKey } from './llm.js';
import { readRootPackageJson } from './repo.js';
import type { CheckResult, FilePatch, MigrationPlan, RiskLevel } from './types.js';

type LlmMigration = {
  title: string;
  explanation: string;
  risk: RiskLevel;
  riskNotes: string[];
  dependencyBumps: Record<string, string>;
  patches: Array<{ path: string; content: string; description: string }>;
  testPlan: string[];
};

const MIGRATE_SYSTEM = `You are a careful staff engineer generating MINIMAL migrations for AstroLink.
Return JSON only.

Hard rules:
- Only change files that are necessary for the material changes identified.
- Prefer dependency version bumps + tiny call-site edits over rewrites.
- Never invent new product features.
- Never remove Gemini fallback or E2E stub paths unless required by a breaking change.
- Preserve existing comments that document launch decisions.
- NEVER put package.json in patches. Dependency version changes go ONLY in dependencyBumps (e.g. { "openai": "^6.49.0" }). The tool merges those keys into the real package.json.
- File contents must be complete valid files (not diffs) for source patches.
- If the only change is an npm version bump with no code impact, patches must be empty and dependencyBumps set.
- Paths are relative to monorepo root (e.g. src/lib/llm.ts).
- Do not touch tools/maintain unless necessary.`;

export async function planMigration(
  check: CheckResult,
  options: { dryRun: boolean },
): Promise<MigrationPlan> {
  if (!hasOpenAIKey()) {
    // Deterministic fallback: version-only bump when lagging
    return deterministicBumpPlan(check, options.dryRun);
  }

  const llm = await completeJson<LlmMigration>({
    system: MIGRATE_SYSTEM,
    user: JSON.stringify(
      {
        task: 'Generate minimal migration for AstroLink',
        provider: check.provider,
        materialChanges: check.materialChanges,
        technicalSummary: check.technicalSummary,
        usage: {
          packageName: check.usage.packageName,
          declaredVersion: check.usage.declaredVersion,
          installedVersion: check.usage.installedVersion,
          latestVersion: check.usage.latestVersion,
          models: check.usage.models,
          apiPatterns: check.usage.apiPatterns,
          files: check.usage.files,
          envKeys: check.usage.envKeys,
          excerpts: check.usage.excerpts.map((e) => ({
            path: e.path,
            content: e.content.slice(0, 6000),
          })),
        },
        releaseNotesDigest: check.releaseNotesDigest.slice(0, 10000),
        returnSchema: {
          title: 'string',
          explanation: 'markdown for PR body',
          risk: 'none|low|medium|high',
          riskNotes: ['string'],
          dependencyBumps: { 'package-name': '^x.y.z' },
          patches: [{ path: 'src/...', content: 'full file', description: 'why' }],
          testPlan: ['string'],
        },
      },
      null,
      2,
    ),
  });

  const patches: FilePatch[] = (llm.patches ?? [])
    .filter((p) => p.path && typeof p.content === 'string')
    .map((p) => ({
      path: p.path.replace(/^\.\//, ''),
      content: p.content,
      description: p.description || 'Update for provider migration',
    }))
    // Never accept full rewrites of package.json — LLM once wiped next/react/etc.
    .filter((p) => {
      const norm = p.path.replace(/\\/g, '/');
      if (norm === 'package.json' || norm.endsWith('/package.json')) {
        console.warn(
          'astro-maintain: ignoring LLM package.json patch (use dependencyBumps only)',
        );
        return false;
      }
      return true;
    });

  // Always ensure dependency bump is present when versions lag
  const dependencyBumps = { ...(llm.dependencyBumps ?? {}) };
  if (
    check.usage.packageName &&
    check.usage.latestVersion &&
    check.usage.installedVersion !== check.usage.latestVersion &&
    !dependencyBumps[check.usage.packageName]
  ) {
    dependencyBumps[check.usage.packageName] = `^${check.usage.latestVersion}`;
  }

  const plan: MigrationPlan = {
    provider: check.provider,
    dryRun: options.dryRun,
    title: llm.title || `chore(maintain): update ${check.provider}`,
    explanation: llm.explanation || check.technicalSummary,
    ceoSummary: '',
    risk: llm.risk ?? 'medium',
    riskNotes: llm.riskNotes ?? [],
    patches,
    dependencyBumps,
    testPlan: llm.testPlan?.length
      ? llm.testPlan
      : defaultTestPlan(check.provider),
  };
  plan.ceoSummary = ceoFromMigration(plan);
  return plan;
}

function deterministicBumpPlan(check: CheckResult, dryRun: boolean): MigrationPlan {
  const bumps: Record<string, string> = {};
  if (check.usage.packageName && check.usage.latestVersion) {
    bumps[check.usage.packageName] = `^${check.usage.latestVersion}`;
  }
  const plan: MigrationPlan = {
    provider: check.provider,
    dryRun,
    title: `chore(maintain): bump ${check.usage.packageName ?? check.provider} to ${check.usage.latestVersion ?? 'latest'}`,
    explanation: [
      `## Migration (deterministic fallback — no OPENAI_API_KEY for code rewrite)`,
      ``,
      `Bump dependency only. Manual review of release notes recommended:`,
      check.releaseNotesDigest.slice(0, 2000),
      ``,
      `### Material changes from check`,
      ...check.materialChanges.map((c) => `- **${c.title}**: ${c.summary}`),
    ].join('\n'),
    ceoSummary: '',
    risk: 'low',
    riskNotes: [
      'LLM migration generation was unavailable; only package.json version was planned.',
      'Run npm install after applying and re-run unit tests for LLM paths.',
    ],
    patches: [],
    dependencyBumps: bumps,
    testPlan: defaultTestPlan(check.provider),
  };
  plan.ceoSummary = ceoFromMigration(plan);
  return plan;
}

function defaultTestPlan(provider: string): string[] {
  if (provider === 'openai') {
    return [
      'npm test -- src/lib/llm.test.ts',
      'Smoke: generate a briefing with LLM_PROVIDER=openai (or smoke:briefing if configured)',
      'Confirm live caption path still rate-limits and stubs under E2E_STUB_LLM=true',
    ];
  }
  return ['npm test', 'npm run build'];
}

export type ApplyResult = {
  written: string[];
  skipped: string[];
  packageJsonUpdated: boolean;
};

export function applyMigration(repoRoot: string, plan: MigrationPlan): ApplyResult {
  const written: string[] = [];
  const skipped: string[] = [];

  for (const patch of plan.patches) {
    if (patch.path.includes('..') || path.isAbsolute(patch.path)) {
      skipped.push(patch.path);
      continue;
    }
    // Safety: only allow known trees
    if (!isAllowedPath(patch.path)) {
      skipped.push(`${patch.path} (path not in allowlist)`);
      continue;
    }
    const full = path.join(repoRoot, patch.path);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, patch.content.endsWith('\n') ? patch.content : `${patch.content}\n`, 'utf8');
    written.push(patch.path);
  }

  let packageJsonUpdated = false;
  if (Object.keys(plan.dependencyBumps).length > 0) {
    packageJsonUpdated = bumpPackageJson(repoRoot, plan.dependencyBumps);
    if (packageJsonUpdated) written.push('package.json');
  }

  return { written, skipped, packageJsonUpdated };
}

function isAllowedPath(rel: string): boolean {
  const normalized = rel.replace(/\\/g, '/');
  // package.json is updated only via dependencyBumps (surgical key merge), never full rewrite.
  if (normalized === 'package.json' || normalized.endsWith('/package.json')) return false;
  if (normalized === '.env.example') return true;
  return (
    normalized.startsWith('src/') ||
    normalized.startsWith('docs/') ||
    normalized.startsWith('e2e/') ||
    normalized.startsWith('scripts/')
  );
}

/** Guard: refuse to write a package.json that dropped critical app deps. */
function assertPackageJsonStillValid(repoRoot: string): void {
  const pkg = readRootPackageJson(repoRoot) as {
    name?: string;
    dependencies?: Record<string, string>;
  };
  const deps = pkg.dependencies ?? {};
  const required = ['next', 'react', 'react-dom'];
  const missing = required.filter((k) => !deps[k]);
  if (missing.length || pkg.name !== 'astrolink') {
    throw new Error(
      `Refusing package.json write: missing [${missing.join(', ')}] or name!==astrolink. ` +
        `Restore package.json from main and re-run migrate.`,
    );
  }
}

function bumpPackageJson(repoRoot: string, bumps: Record<string, string>): boolean {
  const pkgPath = path.join(repoRoot, 'package.json');
  if (!existsSync(pkgPath)) return false;
  const pkg = readRootPackageJson(repoRoot) as Record<string, unknown> & {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  let changed = false;
  for (const [name, version] of Object.entries(bumps)) {
    if (pkg.dependencies?.[name] != null && pkg.dependencies[name] !== version) {
      pkg.dependencies[name] = version;
      changed = true;
    } else if (pkg.devDependencies?.[name] != null && pkg.devDependencies[name] !== version) {
      pkg.devDependencies[name] = version;
      changed = true;
    } else if (pkg.dependencies && pkg.dependencies[name] == null && pkg.devDependencies?.[name] == null) {
      // only bump if already a dependency; do not add new deps silently
      continue;
    }
  }
  if (!changed) return false;
  const raw = readFileSync(pkgPath, 'utf8');
  const indent = raw.includes('\t') ? '\t' : '  ';
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, indent)}\n`, 'utf8');
  assertPackageJsonStillValid(repoRoot);
  return true;
}

export function formatMigrationReport(plan: MigrationPlan, apply?: ApplyResult): string {
  const lines = [
    `# Migration: ${plan.title}`,
    ``,
    plan.dryRun ? `**Mode:** dry-run (no files written)` : `**Mode:** apply`,
    `**Risk:** ${plan.risk}`,
    ``,
    `## Explanation`,
    plan.explanation,
    ``,
    `## Dependency bumps`,
    Object.keys(plan.dependencyBumps).length
      ? Object.entries(plan.dependencyBumps)
          .map(([k, v]) => `- \`${k}\` → \`${v}\``)
          .join('\n')
      : '_None_',
    ``,
    `## File patches`,
    plan.patches.length
      ? plan.patches.map((p) => `- \`${p.path}\` — ${p.description}`).join('\n')
      : '_None_',
    ``,
    `## Risk notes`,
    ...(plan.riskNotes.length ? plan.riskNotes.map((n) => `- ${n}`) : ['- None']),
    ``,
    `## Test plan`,
    ...plan.testPlan.map((t) => `- ${t}`),
  ];

  if (apply) {
    lines.push(
      ``,
      `## Apply result`,
      `- Written: ${apply.written.join(', ') || 'none'}`,
      `- Skipped: ${apply.skipped.join(', ') || 'none'}`,
      `- package.json updated: ${apply.packageJsonUpdated}`,
    );
  }

  lines.push(``, `---`, ``, `## Tech → CEO`, ``, plan.ceoSummary);
  return lines.join('\n');
}
