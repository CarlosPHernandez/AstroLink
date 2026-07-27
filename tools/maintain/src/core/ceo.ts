import type { CheckResult, MaterialChange, MigrationPlan, RiskLevel } from './types.js';

function riskPhrase(risk: RiskLevel): string {
  switch (risk) {
    case 'none':
      return 'no real business risk';
    case 'low':
      return 'low risk — routine maintenance';
    case 'medium':
      return 'medium risk — review before merging';
    case 'high':
      return 'high risk — can break AI features or inflate cost if wrong';
  }
}

function businessWhy(provider: CheckResult['provider']): string {
  switch (provider) {
    case 'openai':
      return 'This is the AI path behind expert briefs, captions, and matching. Stale SDKs/models mean silent quality drops, higher failure rates, or unexpected cost — not just "tech debt."';
    case 'stripe':
      return 'This is how mentees pay for sessions. SDK or API drift can break checkout, webhooks, or refunds — direct revenue risk.';
    case 'supabase':
      return 'This is auth + core data. Drift here means login failures or broken dashboards for mentors and mentees.';
    case 'daily':
      return 'This is the live video room. Breakage here is a failed paid session — highest customer-trust surface after payment.';
  }
}

function healthyWhy(provider: CheckResult['provider']): string {
  switch (provider) {
    case 'openai':
      return 'AI briefing, live captions, and matching stay on a supported stack without surprise breakage or cost spikes.';
    case 'stripe':
      return 'Checkout and payout-related flows stay on a supported Stripe SDK without surprise payment failures.';
    case 'supabase':
      return 'Auth and data access stay on supported clients without surprise login/dashboard breakage.';
    case 'daily':
      return 'Video sessions stay on a supported Daily client without surprise join failures.';
  }
}

/**
 * Deterministic CEO translation (no extra LLM call).
 * Mirrors skills/tech-to-ceo-communication principles: business first, decision-oriented.
 */
export function ceoFromCheck(result: CheckResult): string {
  const name = result.provider.toUpperCase();
  const changes = result.materialChanges;

  if (result.upToDate && changes.length === 0) {
    return [
      `### One-sentence outcome`,
      `${name} is current for how AstroLink actually uses it — nothing to do right now.`,
      ``,
      `### Why this matters`,
      healthyWhy(result.provider),
      ``,
      `### Specific ask`,
      `None. Re-check after the next ${name} announcement or monthly ops pass.`,
    ].join('\n');
  }

  const highest = highestRisk(changes);
  const titles = changes.map((c) => `• ${c.title} (${riskPhrase(c.risk)})`).join('\n');
  const modelsLine =
    result.usage.models.length > 0
      ? `Models in use: ${result.usage.models.join(', ')}`
      : `API surface: ${result.usage.apiPatterns.slice(0, 4).join(', ') || 'see technical summary'}`;

  return [
    `### One-sentence outcome`,
    result.recommendedNextStep === 'migrate'
      ? `${name} has material updates that likely affect AstroLink — run migrate when you want a PR-ready patch.`
      : `${name} has updates worth a human glance; no automatic code change required yet.`,
    ``,
    `### Why this matters for the business`,
    businessWhy(result.provider),
    ``,
    `### Current vs desired`,
    `Installed: ${result.usage.installedVersion ?? 'unknown'} → Latest: ${result.usage.latestVersion ?? 'unknown'}`,
    modelsLine,
    ``,
    `### What changed (plain language)`,
    titles || '• Version lag only — details in technical summary',
    ``,
    `### Risk`,
    riskPhrase(highest),
    ``,
    `### Specific ask`,
    result.recommendedNextStep === 'migrate'
      ? `Review the proposed migration (or run with --dry-run first). Merge only if the risk notes look acceptable.`
      : `Read the technical summary; decide whether to schedule a migrate this sprint or ignore until the next check.`,
  ].join('\n');
}

export function ceoFromMigration(plan: MigrationPlan): string {
  return [
    `### One-sentence outcome`,
    plan.dryRun
      ? `Dry-run migration plan for ${plan.provider}: ${plan.title} (no files written).`
      : `Migration applied for ${plan.provider}: ${plan.title}.`,
    ``,
    `### Why this matters`,
    businessWhy(plan.provider),
    ``,
    `### What will change`,
    plan.patches.length
      ? plan.patches.map((p) => `• ${p.path} — ${p.description}`).join('\n')
      : '• Dependency bump only (or no file patches needed)',
    Object.keys(plan.dependencyBumps).length
      ? `• package.json: ${Object.entries(plan.dependencyBumps)
          .map(([k, v]) => `${k}@${v}`)
          .join(', ')}`
      : '',
    ``,
    `### Risk`,
    riskPhrase(plan.risk),
    ...plan.riskNotes.map((n) => `• ${n}`),
    ``,
    `### Specific ask`,
    plan.dryRun
      ? `If the plan looks right, re-run without --dry-run (optionally --pr) and review the PR like any other code change.`
      : `Review the diff, run the test plan below, then merge or revert.`,
    ``,
    `### Test plan (engineering)`,
    ...plan.testPlan.map((t) => `• ${t}`),
  ]
    .filter(Boolean)
    .join('\n');
}

function highestRisk(changes: MaterialChange[]): RiskLevel {
  const order: RiskLevel[] = ['none', 'low', 'medium', 'high'];
  let best: RiskLevel = 'none';
  for (const c of changes) {
    if (order.indexOf(c.risk) > order.indexOf(best)) best = c.risk;
  }
  return best;
}
