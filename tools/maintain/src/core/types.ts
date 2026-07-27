export type ProviderId = 'openai' | 'stripe' | 'supabase' | 'daily';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type ChangeKind =
  | 'sdk_upgrade'
  | 'model_deprecation'
  | 'api_shape'
  | 'parameter'
  | 'config'
  | 'docs_only'
  | 'other';

/** Deterministic snapshot of how this repo uses a provider. */
export type UsageSnapshot = {
  provider: ProviderId;
  packageName: string | null;
  /** Version declared in root package.json (e.g. ^6.39.1). */
  declaredVersion: string | null;
  /** Version actually installed in node_modules. */
  installedVersion: string | null;
  /** Latest version on npm (when fetch succeeds). */
  latestVersion: string | null;
  /** Model IDs / API surface strings found in source. */
  models: string[];
  /** Key API call patterns (e.g. chat.completions.create). */
  apiPatterns: string[];
  /** Source files that import or configure this provider. */
  files: string[];
  /** Short excerpts for LLM context (path + relevant lines). */
  excerpts: { path: string; content: string }[];
  envKeys: string[];
  notes: string[];
};

export type MaterialChange = {
  kind: ChangeKind;
  title: string;
  summary: string;
  /** Why this matters for AstroLink specifically. */
  impact: string;
  risk: RiskLevel;
  /** Suggested action in one line. */
  action: string;
  sourceUrls: string[];
};

export type CheckResult = {
  provider: ProviderId;
  checkedAt: string;
  usage: UsageSnapshot;
  upToDate: boolean;
  materialChanges: MaterialChange[];
  /** Engineer-facing report. */
  technicalSummary: string;
  /** Non-technical founder-facing translation. */
  ceoSummary: string;
  /** Raw release notes / changelog snippets used in analysis. */
  releaseNotesDigest: string;
  recommendedNextStep: 'none' | 'review' | 'migrate';
};

export type FilePatch = {
  path: string;
  /** Full new file contents when rewrite; null means delete (unused in v0). */
  content: string;
  description: string;
};

export type MigrationPlan = {
  provider: ProviderId;
  dryRun: boolean;
  title: string;
  explanation: string;
  ceoSummary: string;
  risk: RiskLevel;
  riskNotes: string[];
  patches: FilePatch[];
  /** package.json dependency bumps, e.g. { openai: "^6.49.0" }. */
  dependencyBumps: Record<string, string>;
  testPlan: string[];
};

export type ProviderStatus = {
  provider: ProviderId;
  lastCheckedAt: string | null;
  installedVersion: string | null;
  latestVersion: string | null;
  upToDate: boolean | null;
  pendingChanges: number;
  recommendedNextStep: CheckResult['recommendedNextStep'] | null;
  lastCeoSummary: string | null;
};

export type StatusFile = {
  updatedAt: string;
  providers: Partial<Record<ProviderId, ProviderStatus>>;
  lastMigration?: {
    provider: ProviderId;
    at: string;
    title: string;
    dryRun: boolean;
    prUrl?: string;
  };
};

export type ProviderModule = {
  id: ProviderId;
  displayName: string;
  detectUsage(repoRoot: string): Promise<UsageSnapshot>;
  fetchLatest(usage: UsageSnapshot): Promise<{
    latestVersion: string | null;
    releaseNotesDigest: string;
    sourceUrls: string[];
  }>;
  /** Optional deterministic hints before LLM (e.g. version lag). */
  quickSignals?(usage: UsageSnapshot, latestVersion: string | null): MaterialChange[];
};
