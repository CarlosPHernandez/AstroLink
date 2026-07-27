import {
  getDeclaredVersion,
  getInstalledVersion,
  readFileExcerpt,
  searchFiles,
} from '../core/repo.js';
import type { ProviderModule } from '../core/types.js';

const PACKAGE = 'stripe';

/** Stub-quality provider for v0 — detect + fetch only; full LLM migrate later. */
export const stripeProvider: ProviderModule = {
  id: 'stripe',
  displayName: 'Stripe',

  async detectUsage(repoRoot) {
    const hits = searchFiles(
      repoRoot,
      [/from ['"]stripe['"]/, /@stripe\//, /STRIPE_/, /PaymentIntent|payment_intent/],
      { includeDirs: ['src', 'docs'], maxHits: 100 },
    );
    const files = [...new Set(hits.map((h) => h.path))].sort();
    const excerpts: { path: string; content: string }[] = [];
    const candidateExcerpts = [
      'package.json',
      ...files.filter((f) => f.includes('stripe') || f.includes('payment')).slice(0, 4),
    ];
    for (const p of candidateExcerpts) {
      const content = readFileExcerpt(repoRoot, p, 2500);
      if (content) excerpts.push({ path: p, content });
    }

    return {
      provider: 'stripe',
      packageName: PACKAGE,
      declaredVersion: getDeclaredVersion(repoRoot, PACKAGE),
      installedVersion: getInstalledVersion(repoRoot, PACKAGE),
      latestVersion: null,
      models: [],
      apiPatterns: [...new Set(hits.filter((h) => /paymentIntents|webhooks|checkout/i.test(h.text)).map((h) => h.text.slice(0, 80)))],
      files,
      excerpts,
      envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'SKIP_STRIPE_PAYMENTS'],
      notes: [
        'v0: detection only. Platform-only PaymentIntents; Connect deferred.',
        'Full migrate path not implemented yet — use check for version lag.',
      ],
    };
  },

  async fetchLatest(usage) {
    let latestVersion: string | null = null;
    let releaseNotesDigest = `Installed stripe ${usage.installedVersion ?? 'unknown'}\n`;
    try {
      const res = await fetch('https://registry.npmjs.org/stripe/latest');
      if (res.ok) {
        const body = (await res.json()) as { version?: string };
        latestVersion = body.version ?? null;
        releaseNotesDigest += `Latest npm: ${latestVersion}\n`;
      }
    } catch (e) {
      releaseNotesDigest += `npm fetch failed: ${e instanceof Error ? e.message : e}\n`;
    }
    releaseNotesDigest +=
      '\nFull Stripe migration analysis is Priority 2 — not fully implemented in v0.\n';
    return {
      latestVersion,
      releaseNotesDigest,
      sourceUrls: ['https://github.com/stripe/stripe-node/releases', 'https://docs.stripe.com/changelog'],
    };
  },

  quickSignals(usage, latest) {
    if (usage.installedVersion && latest && usage.installedVersion !== latest) {
      return [
        {
          kind: 'sdk_upgrade',
          title: `stripe SDK ${usage.installedVersion} → ${latest}`,
          summary: 'Version lag detected. Full impact analysis not yet implemented.',
          impact: 'Booking payments / webhooks may need review on API version pin.',
          risk: 'medium',
          action: 'Manual review or wait for stripe provider migrate support.',
          sourceUrls: ['https://github.com/stripe/stripe-node/releases'],
        },
      ];
    }
    return [];
  },
};
