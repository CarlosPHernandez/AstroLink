import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'playwright-report',
  'test-results',
  '.turbo',
  'tools',
]);

/** Walk up from this file until we find the monorepo root package.json named "astrolink". */
export function findRepoRoot(startDir = process.cwd()): string {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === 'astrolink') return dir;
      } catch {
        // continue
      }
    }
    // tools/maintain lives two levels under root
    if (existsSync(path.join(dir, 'src', 'lib', 'llm.ts')) && existsSync(pkgPath)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: relative to this module (tools/maintain/src/core → repo root)
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../..');
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

export function readRootPackageJson(repoRoot: string): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
  return readJson(path.join(repoRoot, 'package.json'));
}

export function getDeclaredVersion(repoRoot: string, packageName: string): string | null {
  const pkg = readRootPackageJson(repoRoot);
  return pkg.dependencies?.[packageName] ?? pkg.devDependencies?.[packageName] ?? null;
}

export function getInstalledVersion(repoRoot: string, packageName: string): string | null {
  const pkgPath = path.join(repoRoot, 'node_modules', packageName, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = readJson<{ version?: string }>(pkgPath);
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

export type GrepHit = { path: string; line: number; text: string };

/**
 * Lightweight recursive text search (no ripgrep dependency).
 * Scans .ts/.tsx/.js/.mjs/.cjs/.json/.md under includeDirs when provided.
 */
export function searchFiles(
  repoRoot: string,
  patterns: RegExp[],
  options?: {
    includeDirs?: string[];
    extensions?: string[];
    maxHits?: number;
  },
): GrepHit[] {
  const extensions = options?.extensions ?? ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md'];
  const maxHits = options?.maxHits ?? 200;
  const roots =
    options?.includeDirs?.map((d) => path.join(repoRoot, d)) ?? [path.join(repoRoot, 'src')];

  const hits: GrepHit[] = [];

  function walk(dir: string) {
    if (hits.length >= maxHits) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (hits.length >= maxHits) return;
      if (name.startsWith('.') && name !== '.env.example') continue;
      if (IGNORE_DIRS.has(name)) continue;
      const full = path.join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!extensions.some((ext) => name.endsWith(ext))) continue;
      let content: string;
      try {
        content = readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      // skip huge files
      if (content.length > 500_000) continue;
      const lines = content.split('\n');
      lines.forEach((text, idx) => {
        if (hits.length >= maxHits) return;
        if (patterns.some((p) => p.test(text))) {
          hits.push({
            path: path.relative(repoRoot, full),
            line: idx + 1,
            text: text.trim(),
          });
        }
      });
    }
  }

  for (const root of roots) {
    if (existsSync(root)) walk(root);
  }
  return hits;
}

export function readFileExcerpt(
  repoRoot: string,
  relPath: string,
  maxChars = 4000,
): string | null {
  const full = path.join(repoRoot, relPath);
  if (!existsSync(full)) return null;
  try {
    const raw = readFileSync(full, 'utf8');
    return raw.length > maxChars ? `${raw.slice(0, maxChars)}\n/* …truncated… */` : raw;
  } catch {
    return null;
  }
}

export function loadDotEnvLocal(repoRoot: string): void {
  const envPath = path.join(repoRoot, '.env.local');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
