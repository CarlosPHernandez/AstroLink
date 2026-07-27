import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CheckResult, ProviderId, StatusFile } from './types.js';

const DIR_NAME = '.astro-maintain';
const FILE_NAME = 'status.json';

export function statusPath(repoRoot: string): string {
  return path.join(repoRoot, DIR_NAME, FILE_NAME);
}

export function readStatus(repoRoot: string): StatusFile {
  const p = statusPath(repoRoot);
  if (!existsSync(p)) {
    return { updatedAt: new Date().toISOString(), providers: {} };
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as StatusFile;
  } catch {
    return { updatedAt: new Date().toISOString(), providers: {} };
  }
}

export function writeStatus(repoRoot: string, status: StatusFile): void {
  const dir = path.join(repoRoot, DIR_NAME);
  mkdirSync(dir, { recursive: true });
  status.updatedAt = new Date().toISOString();
  writeFileSync(path.join(dir, FILE_NAME), `${JSON.stringify(status, null, 2)}\n`, 'utf8');
}

export function recordCheck(repoRoot: string, result: CheckResult): StatusFile {
  const status = readStatus(repoRoot);
  status.providers[result.provider] = {
    provider: result.provider,
    lastCheckedAt: result.checkedAt,
    installedVersion: result.usage.installedVersion,
    latestVersion: result.usage.latestVersion,
    upToDate: result.upToDate,
    pendingChanges: result.materialChanges.length,
    recommendedNextStep: result.recommendedNextStep,
    lastCeoSummary: result.ceoSummary,
  };
  writeStatus(repoRoot, status);
  return status;
}

export function recordMigration(
  repoRoot: string,
  provider: ProviderId,
  title: string,
  dryRun: boolean,
  prUrl?: string,
): StatusFile {
  const status = readStatus(repoRoot);
  status.lastMigration = {
    provider,
    at: new Date().toISOString(),
    title,
    dryRun,
    prUrl,
  };
  writeStatus(repoRoot, status);
  return status;
}
