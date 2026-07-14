/**
 * Send one Chris early-waitlist sequence email to a single address (manual QA).
 *
 * Usage:
 *   npm run email:chris-waitlist-test -- --to you@example.com
 *
 *   # or all four sequence emails:
 *   npm run email:chris-waitlist-test -- --to you@example.com --template all
 *
 *   # dry-run (subject only, no send):
 *   npm run email:chris-waitlist-test -- --to you@example.com --dry-run
 *
 * Templates:
 *   chris-initial-offer | chris-clicked-reminder | chris-value-nurture | chris-final-urgency | all
 *
 * Requires RESEND_API_KEY in .env.local. Uses RESEND_FROM if set.
 * Bypasses NOTIFICATIONS_DISABLED (this CLI is an explicit opt-in send).
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {
    to: '',
    template: 'chris-initial-offer',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--to') out.to = argv[++i] ?? '';
    else if (a === '--name') {
      // Deprecated: waitlist audience is email-only; greeting is always "Hey,"
      i += 1;
    } else if (a === '--template') out.template = argv[++i] ?? out.template;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

const TEMPLATES = [
  'chris-initial-offer',
  'chris-clicked-reminder',
  'chris-value-nurture',
  'chris-final-urgency',
];

async function loadBuilders() {
  // Compile TS via vitest/vite-node is heavy; use dynamic import through tsx if available,
  // else register with node --experimental-strip-types when present.
  const modPath = path.join(root, 'src/lib/email/chris-early-waitlist-sequence-templates.ts');
  try {
    return await import(pathToFileURL(modPath).href);
  } catch (err) {
    throw new Error(
      `Could not import templates. Prefer: npm run email:chris-waitlist-test -- --to you@example.com\n${err}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  npm run email:chris-waitlist-test -- --to you@example.com

  Greeting is always "Hey," (email-only waitlist audience — no first name).

  --template all|chris-initial-offer|chris-clicked-reminder|chris-value-nurture|chris-final-urgency
  --dry-run          print subject only, do not send
`);
    process.exit(0);
  }

  if (!args.to?.includes('@')) {
    console.error('Missing or invalid --to email');
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey && !args.dryRun) {
    console.error('RESEND_API_KEY is not set (use --env-file=.env.local)');
    process.exit(1);
  }

  const from =
    process.env.RESEND_FROM?.trim() || 'AstroLink <notifications@astro-link.space>';

  const { buildChrisSequenceEmail } = await loadBuilders();
  const { Resend } = require('resend');
  const resend = apiKey ? new Resend(apiKey) : null;

  const ids =
    args.template === 'all' ? TEMPLATES : [args.template];

  for (const id of ids) {
    if (!TEMPLATES.includes(id)) {
      console.error(`Unknown template: ${id}. Choose: ${TEMPLATES.join(' | ')} | all`);
      process.exit(1);
    }

    const built = buildChrisSequenceEmail(id, {
      email: args.to,
    });

    console.log(`\n--- ${built.templateId} ---`);
    console.log(`To:      ${args.to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${built.subject}`);

    if (args.dryRun) {
      console.log('(dry-run — not sent)');
      continue;
    }

    const { data, error } = await resend.emails.send({
      from,
      to: args.to,
      subject: built.subject,
      html: built.html,
      text: built.text,
    });

    if (error) {
      console.error('Send failed:', error.message ?? error);
      process.exit(1);
    }
    console.log('Sent. Resend id:', data?.id ?? '(none)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
