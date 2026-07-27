import { ceoFromCheck } from './ceo.js';
import { completeJson, hasOpenAIKey } from './llm.js';
import type {
  CheckResult,
  MaterialChange,
  ProviderModule,
  RiskLevel,
  UsageSnapshot,
} from './types.js';

type LlmAnalysis = {
  upToDate: boolean;
  materialChanges: Array<{
    kind: string;
    title: string;
    summary: string;
    impact: string;
    risk: RiskLevel;
    action: string;
  }>;
  technicalSummary: string;
  recommendedNextStep: 'none' | 'review' | 'migrate';
};

const ANALYSIS_SYSTEM = `You are a senior engineer maintaining AstroLink, a Next.js marketplace for expert mentorship sessions.
Your job: decide whether external SDK/API changes MATERIALY affect THIS codebase — not the whole ecosystem.

Rules:
- Only flag changes that affect call sites, models, response shapes, auth, or config this repo uses.
- Ignore unrelated SDK features (assistants, realtime, images, fine-tuning) unless usage shows them.
- Prefer "none" / "review" over "migrate" when a version bump is pure patch with no API impact on our usage.
- Be specific about AstroLink files and models when possible.
- risk: none | low | medium | high
- recommendedNextStep: none | review | migrate
- Return JSON only matching the schema described by the user.`;

export async function runCheck(
  provider: ProviderModule,
  repoRoot: string,
  options?: { skipLlm?: boolean },
): Promise<CheckResult> {
  const usage = await provider.detectUsage(repoRoot);
  const latest = await provider.fetchLatest(usage);
  usage.latestVersion = latest.latestVersion ?? usage.latestVersion;

  const quick = provider.quickSignals?.(usage, usage.latestVersion) ?? [];
  let materialChanges: MaterialChange[] = [...quick];
  let technicalSummary = '';
  let recommendedNextStep: CheckResult['recommendedNextStep'] = 'none';
  let upToDate =
    usage.installedVersion != null &&
    usage.latestVersion != null &&
    usage.installedVersion === usage.latestVersion &&
    materialChanges.length === 0;

  if (options?.skipLlm || !hasOpenAIKey()) {
    technicalSummary = buildDeterministicSummary(usage, latest.releaseNotesDigest, materialChanges);
    if (!hasOpenAIKey() && !options?.skipLlm) {
      technicalSummary +=
        '\n\n(LLM analysis skipped — set OPENAI_API_KEY for deeper release-note interpretation.)';
    }
    recommendedNextStep = materialChanges.length
      ? versionLag(usage)
        ? 'migrate'
        : 'review'
      : 'none';
    upToDate = materialChanges.length === 0 && !versionLag(usage);
  } else {
    const llm = await completeJson<LlmAnalysis>({
      system: ANALYSIS_SYSTEM,
      user: JSON.stringify(
        {
          task: 'Analyze material impact of provider updates on AstroLink usage',
          provider: provider.id,
          usage: {
            packageName: usage.packageName,
            declaredVersion: usage.declaredVersion,
            installedVersion: usage.installedVersion,
            latestVersion: usage.latestVersion,
            models: usage.models,
            apiPatterns: usage.apiPatterns,
            files: usage.files,
            envKeys: usage.envKeys,
            notes: usage.notes,
            excerpts: usage.excerpts.map((e) => ({
              path: e.path,
              content: e.content.slice(0, 3000),
            })),
          },
          releaseNotesDigest: latest.releaseNotesDigest.slice(0, 12000),
          sourceUrls: latest.sourceUrls,
          quickSignals: quick,
          returnSchema: {
            upToDate: 'boolean',
            materialChanges: [
              {
                kind: 'sdk_upgrade|model_deprecation|api_shape|parameter|config|docs_only|other',
                title: 'string',
                summary: 'string',
                impact: 'string — AstroLink-specific',
                risk: 'none|low|medium|high',
                action: 'string',
              },
            ],
            technicalSummary: 'markdown string for engineers',
            recommendedNextStep: 'none|review|migrate',
          },
        },
        null,
        2,
      ),
    });

    materialChanges = mergeChanges(
      quick,
      (llm.materialChanges ?? []).map((c) => ({
        kind: (c.kind as MaterialChange['kind']) || 'other',
        title: c.title,
        summary: c.summary,
        impact: c.impact,
        risk: c.risk ?? 'low',
        action: c.action,
        sourceUrls: latest.sourceUrls,
      })),
    );
    technicalSummary = llm.technicalSummary || buildDeterministicSummary(usage, latest.releaseNotesDigest, materialChanges);
    recommendedNextStep = llm.recommendedNextStep ?? 'review';
    upToDate = Boolean(llm.upToDate) && materialChanges.length === 0;
  }

  const result: CheckResult = {
    provider: provider.id,
    checkedAt: new Date().toISOString(),
    usage,
    upToDate,
    materialChanges,
    technicalSummary,
    ceoSummary: '',
    releaseNotesDigest: latest.releaseNotesDigest,
    recommendedNextStep,
  };
  result.ceoSummary = ceoFromCheck(result);
  return result;
}

function versionLag(usage: UsageSnapshot): boolean {
  if (!usage.installedVersion || !usage.latestVersion) return false;
  return usage.installedVersion !== usage.latestVersion;
}

function buildDeterministicSummary(
  usage: UsageSnapshot,
  releaseNotes: string,
  changes: MaterialChange[],
): string {
  const lines = [
    `## ${usage.provider} usage in AstroLink`,
    ``,
    `- Package: ${usage.packageName ?? 'n/a'}`,
    `- Declared: ${usage.declaredVersion ?? 'n/a'}`,
    `- Installed: ${usage.installedVersion ?? 'n/a'}`,
    `- Latest: ${usage.latestVersion ?? 'n/a'}`,
    `- Models: ${usage.models.join(', ') || 'none'}`,
    `- API patterns: ${usage.apiPatterns.join(', ') || 'none'}`,
    `- Files: ${usage.files.join(', ') || 'none'}`,
    `- Env: ${usage.envKeys.join(', ') || 'none'}`,
    ``,
    `### Notes`,
    ...usage.notes.map((n) => `- ${n}`),
    ``,
    `### Signals`,
    changes.length
      ? changes.map((c) => `- [${c.risk}] ${c.title}: ${c.summary}`).join('\n')
      : '- No deterministic material signals',
    ``,
    `### Release notes (digest)`,
    releaseNotes.slice(0, 4000) || '_No release notes fetched_',
  ];
  return lines.join('\n');
}

function mergeChanges(a: MaterialChange[], b: MaterialChange[]): MaterialChange[] {
  const seen = new Set<string>();
  const out: MaterialChange[] = [];
  for (const c of [...a, ...b]) {
    const key = c.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
