#!/usr/bin/env node
/**
 * astro-maintain — autonomous maintenance CLI for AstroLink external services.
 *
 * Usage (from monorepo root):
 *   npx tsx tools/maintain/src/index.ts check openai
 *   npx tsx tools/maintain/src/index.ts migrate openai --dry-run
 *   npx tsx tools/maintain/src/index.ts status
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runCheck } from './core/analyzer.js';
import { createMigrationPr } from './core/github.js';
import { applyMigration, formatMigrationReport, planMigration } from './core/migrator.js';
import { findRepoRoot, loadDotEnvLocal } from './core/repo.js';
import { readStatus, recordCheck, recordMigration } from './core/status-store.js';
import type { ProviderId, ProviderModule } from './core/types.js';
import { dailyProvider } from './providers/daily.js';
import { openaiProvider } from './providers/openai.js';
import { stripeProvider } from './providers/stripe.js';
import { supabaseProvider } from './providers/supabase.js';

const PROVIDERS: Record<ProviderId, ProviderModule> = {
  openai: openaiProvider,
  stripe: stripeProvider,
  supabase: supabaseProvider,
  daily: dailyProvider,
};

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

function resolveProviders(name: string): ProviderModule[] {
  if (name === 'all') return PROVIDER_IDS.map((id) => PROVIDERS[id]);
  if (!(name in PROVIDERS)) {
    throw new Error(`Unknown provider "${name}". Use: ${PROVIDER_IDS.join(' | ')} | all`);
  }
  return [PROVIDERS[name as ProviderId]];
}

function printDivider(title?: string) {
  console.log('');
  console.log(title ? `── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}` : '─'.repeat(64));
}

function printCheckResult(result: Awaited<ReturnType<typeof runCheck>>, ceoOnly: boolean) {
  if (!ceoOnly) {
    printDivider(`${result.provider} technical`);
    console.log(`Checked:    ${result.checkedAt}`);
    console.log(
      `Versions:   installed=${result.usage.installedVersion ?? '?'}  latest=${result.usage.latestVersion ?? '?'}  declared=${result.usage.declaredVersion ?? '?'}`,
    );
    console.log(`Up to date: ${result.upToDate}`);
    console.log(`Next step:  ${result.recommendedNextStep}`);
    console.log(`Models:     ${result.usage.models.join(', ') || '—'}`);
    console.log(`APIs:       ${result.usage.apiPatterns.join(', ') || '—'}`);
    console.log(`Files:      ${result.usage.files.slice(0, 20).join(', ')}${result.usage.files.length > 20 ? '…' : ''}`);
    console.log('');
    if (result.materialChanges.length) {
      console.log('Material changes:');
      for (const c of result.materialChanges) {
        console.log(`  [${c.risk}] ${c.title}`);
        console.log(`         ${c.summary}`);
        console.log(`         → ${c.action}`);
      }
    } else {
      console.log('Material changes: none');
    }
    console.log('');
    console.log(result.technicalSummary);
  }

  printDivider('Tech → CEO');
  console.log(result.ceoSummary);
  console.log('');
  if (!ceoOnly && result.recommendedNextStep === 'migrate') {
    console.log(
      `Hint: npx tsx tools/maintain/src/index.ts migrate ${result.provider} --dry-run`,
    );
  }
}

async function main() {
  const repoRoot = findRepoRoot();
  loadDotEnvLocal(repoRoot);

  await yargs(hideBin(process.argv))
    .scriptName('astro-maintain')
    .usage('$0 <command> [args]')
    .command(
      'check <provider>',
      'Detect usage, fetch latest info, report material changes (openai|stripe|supabase|daily|all)',
      (y) =>
        y
          .positional('provider', {
            type: 'string',
            demandOption: true,
            describe: 'Provider id or "all"',
          })
          .option('skip-llm', {
            type: 'boolean',
            default: false,
            describe: 'Deterministic signals only (no OpenAI analysis call)',
          })
          .option('ceo', {
            type: 'boolean',
            default: false,
            describe: 'Print only the Tech→CEO summary (YC-friendly)',
          }),
      async (argv) => {
        const modules = resolveProviders(String(argv.provider));
        for (const mod of modules) {
          process.stderr.write(`Checking ${mod.displayName}…\n`);
          const result = await runCheck(mod, repoRoot, { skipLlm: Boolean(argv.skipLlm) });
          recordCheck(repoRoot, result);
          printCheckResult(result, Boolean(argv.ceo));
        }
      },
    )
    .command(
      'migrate <provider>',
      'Propose (and optionally apply) a minimal migration for a provider',
      (y) =>
        y
          .positional('provider', {
            type: 'string',
            demandOption: true,
            describe: 'Provider id (not "all" for migrate)',
          })
          .option('dry-run', {
            type: 'boolean',
            default: false,
            describe: 'Plan only — do not write files',
          })
          .option('pr', {
            type: 'boolean',
            default: false,
            describe: 'After apply: create branch, commit, open GitHub PR (requires gh)',
          })
          .option('skip-llm', {
            type: 'boolean',
            default: false,
            describe: 'Skip LLM on check phase',
          })
          .option('ceo', {
            type: 'boolean',
            default: false,
            describe: 'Emphasize Tech→CEO block in output',
          }),
      async (argv) => {
        const name = String(argv.provider);
        if (name === 'all') {
          throw new Error('migrate requires a single provider (e.g. openai). Run check all first.');
        }
        const [mod] = resolveProviders(name);
        if (mod.id !== 'openai') {
          console.warn(
            `Warning: ${mod.displayName} migrate is best-effort in v0 (OpenAI is the fully supported path).\n`,
          );
        }

        process.stderr.write(`Re-checking ${mod.displayName} before migrate…\n`);
        const check = await runCheck(mod, repoRoot, { skipLlm: Boolean(argv.skipLlm) });
        recordCheck(repoRoot, check);

        if (check.upToDate && check.materialChanges.length === 0) {
          console.log(`Nothing to migrate for ${mod.id} — already up to date for detected usage.`);
          printDivider('Tech → CEO');
          console.log(check.ceoSummary);
          return;
        }

        process.stderr.write('Planning migration…\n');
        const plan = await planMigration(check, { dryRun: Boolean(argv.dryRun) });

        let applyResult;
        if (!argv.dryRun) {
          applyResult = applyMigration(repoRoot, plan);
          recordMigration(repoRoot, plan.provider, plan.title, false);
        } else {
          recordMigration(repoRoot, plan.provider, plan.title, true);
        }

        if (argv.ceo) {
          printDivider('Tech → CEO');
          console.log(plan.ceoSummary);
          console.log('');
          console.log('Files that would change:');
          for (const p of plan.patches) console.log(`  - ${p.path}: ${p.description}`);
          for (const [k, v] of Object.entries(plan.dependencyBumps)) {
            console.log(`  - package.json: ${k} → ${v}`);
          }
        } else {
          console.log(formatMigrationReport(plan, applyResult));
        }

        if (!argv.dryRun && argv.pr && applyResult) {
          const files = applyResult.written;
          process.stderr.write('Opening PR…\n');
          const pr = createMigrationPr(repoRoot, plan, files);
          console.log('');
          console.log(`Branch: ${pr.branch}`);
          console.log(pr.message);
          if (pr.prUrl) {
            console.log(`PR: ${pr.prUrl}`);
            recordMigration(repoRoot, plan.provider, plan.title, false, pr.prUrl);
          }
        } else if (argv.dryRun) {
          console.log('');
          console.log(
            `Next: npx tsx tools/maintain/src/index.ts migrate ${mod.id}   # apply`,
          );
          console.log(
            `  or: npx tsx tools/maintain/src/index.ts migrate ${mod.id} --pr`,
          );
        } else if (!argv.dryRun) {
          console.log('');
          console.log('Remember: run npm install if package.json changed, then tests from the plan.');
        }
      },
    )
    .command(
      'status',
      'Show last known versions / pending changes from .astro-maintain/status.json',
      (y) =>
        y.option('ceo', {
          type: 'boolean',
          default: false,
          describe: 'CEO-friendly status only',
        }),
      (argv) => {
        const status = readStatus(repoRoot);
        if (argv.ceo) {
          printDivider('Tech → CEO — maintenance status');
          console.log(`Last updated: ${status.updatedAt}`);
          console.log('');
          for (const id of PROVIDER_IDS) {
            const p = status.providers[id];
            if (!p) {
              console.log(`• ${id}: not checked yet`);
              continue;
            }
            const lag =
              p.installedVersion && p.latestVersion && p.installedVersion !== p.latestVersion
                ? `behind (${p.installedVersion} → ${p.latestVersion})`
                : p.upToDate
                  ? 'current'
                  : 'see last check';
            console.log(`• ${id}: ${lag}; pending signals=${p.pendingChanges}; next=${p.recommendedNextStep ?? '—'}`);
            if (p.lastCeoSummary) {
              console.log(`  ${p.lastCeoSummary.split('\n').find((l) => l && !l.startsWith('#')) ?? ''}`);
            }
          }
          if (status.lastMigration) {
            console.log('');
            console.log(
              `Last migration: ${status.lastMigration.provider} @ ${status.lastMigration.at} (${status.lastMigration.dryRun ? 'dry-run' : 'applied'})${status.lastMigration.prUrl ? ` ${status.lastMigration.prUrl}` : ''}`,
            );
          }
          console.log('');
          console.log('Specific ask: none unless a provider shows "migrate" — then review a dry-run PR.');
          return;
        }

        printDivider('astro-maintain status');
        console.log(`Repo:    ${repoRoot}`);
        console.log(`Updated: ${status.updatedAt}`);
        console.log('');
        console.log(
          'Provider'.padEnd(12) +
            'Installed'.padEnd(14) +
            'Latest'.padEnd(14) +
            'Pending'.padEnd(10) +
            'Next'.padEnd(10) +
            'Checked',
        );
        for (const id of PROVIDER_IDS) {
          const p = status.providers[id];
          if (!p) {
            console.log(id.padEnd(12) + '—'.padEnd(14) + '—'.padEnd(14) + '—'.padEnd(10) + '—'.padEnd(10) + 'never');
            continue;
          }
          console.log(
            id.padEnd(12) +
              (p.installedVersion ?? '—').padEnd(14) +
              (p.latestVersion ?? '—').padEnd(14) +
              String(p.pendingChanges).padEnd(10) +
              (p.recommendedNextStep ?? '—').padEnd(10) +
              (p.lastCheckedAt ?? '—'),
          );
        }
        if (status.lastMigration) {
          console.log('');
          console.log('Last migration:', JSON.stringify(status.lastMigration, null, 2));
        }
        console.log('');
        console.log('Tip: add --ceo for a founder-friendly view.');
      },
    )
    .demandCommand(1, 'Specify a command: check | migrate | status')
    .strict()
    .help()
    .parse();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
