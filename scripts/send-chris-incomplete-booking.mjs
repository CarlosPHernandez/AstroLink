/**
 * Send the Chris incomplete-booking check-in email to one address (ops / QA).
 *
 * Usage:
 *   npm run email:chris-incomplete-booking -- --to you@example.com
 *
 *   # Optional first name (auth profile):
 *   npm run email:chris-incomplete-booking -- --to you@example.com --name Alex
 *
 *   # Waitlist $180 CTA instead of default booking-incomplete ref:
 *   npm run email:chris-incomplete-booking -- --to you@example.com --early
 *
 *   # Custom CTA:
 *   npm run email:chris-incomplete-booking -- --to you@example.com --cta-url 'https://...'
 *
 *   # Dry-run (subject only):
 *   npm run email:chris-incomplete-booking -- --to you@example.com --dry-run
 *
 * Requires RESEND_API_KEY in .env.local. Uses RESEND_FROM if set.
 * Sets reply_to support@astro-link.space so "reply to this email" works.
 * Bypasses NOTIFICATIONS_DISABLED (explicit CLI opt-in).
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const EARLY_CTA =
  'https://www.astro-link.space/talk-with-chris?ref=early-signups';
const DEFAULT_REPLY_TO = 'support@astro-link.space';

function parseArgs(argv) {
  const out = {
    to: '',
    name: '',
    ctaUrl: '',
    early: false,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--to') out.to = argv[++i] ?? '';
    else if (a === '--name') out.name = argv[++i] ?? '';
    else if (a === '--cta-url') out.ctaUrl = argv[++i] ?? '';
    else if (a === '--early') out.early = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function loadBuilder() {
  const modPath = path.join(root, 'src/lib/email/chris-incomplete-booking-templates.ts');
  try {
    return await import(pathToFileURL(modPath).href);
  } catch (err) {
    throw new Error(
      `Could not import templates. Prefer: npm run email:chris-incomplete-booking -- --to you@example.com\n${err}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  npm run email:chris-incomplete-booking -- --to person@example.com

  --name Alex       optional first name for "Hey Alex,"
  --early           use ref=early-signups CTA ($180 waitlist pricing)
  --cta-url URL     custom booking CTA
  --dry-run         print subject only, do not send
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
  const replyTo =
    process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;

  const ctaUrl = args.ctaUrl.trim() || (args.early ? EARLY_CTA : undefined);

  const { buildChrisIncompleteBookingEmail } = await loadBuilder();
  const built = buildChrisIncompleteBookingEmail({
    email: args.to,
    name: args.name || undefined,
    ctaUrl,
  });

  console.log(`\n--- ${built.templateId} ---`);
  console.log(`To:       ${args.to}`);
  console.log(`From:     ${from}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`Subject:  ${built.subject}`);
  if (ctaUrl) console.log(`CTA:      ${ctaUrl}`);
  if (args.name) console.log(`Name:     ${args.name}`);

  if (args.dryRun) {
    console.log('(dry-run — not sent)');
    return;
  }

  const { Resend } = require('resend');
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: args.to,
    replyTo,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });

  if (error) {
    console.error('Send failed:', error.message ?? error);
    process.exit(1);
  }
  console.log('Sent. Resend id:', data?.id ?? '(none)');
  console.log('Check Resend → Emails for open/click tracking.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
