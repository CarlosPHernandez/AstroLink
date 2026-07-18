/**
 * Send Chris 45-min slot reschedule email (ops concierge).
 *
 * Usage:
 *   npm run email:chris-slot-reschedule -- \
 *     --to person@example.com \
 *     --booking-id <uuid> \
 *     --tue 2026-07-21 \
 *     --thu 2026-07-23 \
 *     --fri 2026-07-24
 *
 *   --name Alex
 *   --dry-run
 *
 * Requires RESEND_API_KEY + ENCRYPTION_KEY in .env.local.
 * Reply-To defaults to support@astro-link.space.
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const DEFAULT_REPLY_TO = 'support@astro-link.space';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseArgs(argv) {
  const out = {
    to: '',
    name: '',
    bookingId: '',
    tue: '',
    thu: '',
    fri: '',
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--to') out.to = argv[++i] ?? '';
    else if (a === '--name') out.name = argv[++i] ?? '';
    else if (a === '--booking-id') out.bookingId = argv[++i] ?? '';
    else if (a === '--tue') out.tue = argv[++i] ?? '';
    else if (a === '--thu') out.thu = argv[++i] ?? '';
    else if (a === '--fri') out.fri = argv[++i] ?? '';
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function loadModules() {
  const slotsPath = path.join(root, 'src/lib/chris-campaign/chris-availability-slots.ts');
  const tokenPath = path.join(root, 'src/lib/chris-campaign/chris-slot-choice-token.ts');
  const emailPath = path.join(root, 'src/lib/email/chris-slot-reschedule-templates.ts');
  const [slots, token, email] = await Promise.all([
    import(pathToFileURL(slotsPath).href),
    import(pathToFileURL(tokenPath).href),
    import(pathToFileURL(emailPath).href),
  ]);
  return { slots, token, email };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  npm run email:chris-slot-reschedule -- --to person@example.com --booking-id UUID \\
    --tue YYYY-MM-DD --thu YYYY-MM-DD --fri YYYY-MM-DD

  --name Alex     optional greeting name
  --dry-run       print subjects + slot counts, do not send
`);
    process.exit(0);
  }

  if (!args.to?.includes('@')) {
    console.error('Missing or invalid --to email');
    process.exit(1);
  }
  if (!args.bookingId?.trim()) {
    console.error('Missing --booking-id');
    process.exit(1);
  }
  for (const [key, value] of [
    ['--tue', args.tue],
    ['--thu', args.thu],
    ['--fri', args.fri],
  ]) {
    if (!ISO_DATE.test(value)) {
      console.error(`Missing or invalid ${key} (YYYY-MM-DD)`);
      process.exit(1);
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey && !args.dryRun) {
    console.error('RESEND_API_KEY is not set (use --env-file=.env.local)');
    process.exit(1);
  }
  if (!process.env.ENCRYPTION_KEY?.trim() && !args.dryRun) {
    console.warn(
      'Warning: ENCRYPTION_KEY not set — token will use dev fallback (ok for local only)',
    );
  }

  const from =
    process.env.RESEND_FROM?.trim() || 'AstroLink <notifications@astro-link.space>';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://www.astro-link.space'
  ).replace(/\/$/, '');

  const { slots, token, email } = await loadModules();
  const blocks = slots.buildDefaultBlocks({
    tue: args.tue,
    thu: args.thu,
    fri: args.fri,
  });
  const offers = slots.generateSlotsForBlocks(blocks);
  const payload = token.createChrisSlotTokenPayload({
    bookingId: args.bookingId,
    email: args.to,
    blocks,
  });
  const signed = token.signChrisSlotToken(payload);
  const days = blocks.map((block) => ({
    dayKey: block.dayKey,
    dayLabel: slots.CHRIS_DAY_KEY_LABEL[block.dayKey],
    summary: slots.buildBlockDaySummary(block),
  }));
  const built = email.buildChrisSlotRescheduleEmail({
    contact: { email: args.to, name: args.name || undefined },
    days,
    pickerBaseUrl: baseUrl,
    token: signed,
  });

  console.log(`\n--- ${built.templateId} ---`);
  console.log(`To:        ${args.to}`);
  console.log(`From:      ${from}`);
  console.log(`Reply-To:  ${replyTo}`);
  console.log(`Subject:   ${built.subject}`);
  console.log(`Booking:   ${args.bookingId}`);
  console.log(`Picker:    ${baseUrl}/r/chris-slot?t=…`);
  console.log(`Slots:     ${offers.length} total 45-min starts`);
  for (const block of blocks) {
    const daySlots = slots.generateSlotsForBlock(block);
    const first = daySlots[0]?.timeRangeLabel ?? '—';
    const last = daySlots.at(-1)?.timeRangeLabel ?? '—';
    console.log(
      `  ${block.dayKey} ${block.isoDate}: ${daySlots.length} slots (${first} … ${last})`,
    );
  }

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
  console.log('When they pick a time, ops notify → support@astro-link.space');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
