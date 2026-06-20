/** Single source of truth — trim or remove after XPRIZE deadline (Aug 2026). */
export const XPRIZE_SITE_MENTION =
  'AstroLink is a Build with Gemini XPRIZE entrant in Professional Services Access.';

export const SITE_NAME = 'AstroLink';

export const EXPERTS_INDEX_TITLE = 'Experts · AstroLink';
export const EXPERTS_INDEX_DESCRIPTION =
  'Browse verified aerospace experts — astronauts, flight controllers, and operators. Watch intro videos and book live 1:1 sessions.';

export const EARLY_ACCESS_TITLE = 'Early Access | AstroLink';
export const EARLY_ACCESS_DESCRIPTION =
  'Join the waitlist for AstroLink — live 1:1 video sessions with verified aerospace experts, including Inspiration4 astronaut Chris Sembroski.';

export const PRIVACY_TITLE = 'Privacy Policy | AstroLink';
export const PRIVACY_DESCRIPTION =
  'How AstroLink collects, uses, and protects your personal information.';

export function truncateMetaDescription(text: string, max = 160): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

/** Site-level pages only — never use on per-expert metadata. */
export function withXprizeMention(description: string, max = 160): string {
  const combined = `${description.trim()} ${XPRIZE_SITE_MENTION}`;
  if (combined.length <= max) {
    return combined;
  }
  // Keep the XPRIZE clause intact for competition discoverability; trim the lead-in.
  const suffix = ` ${XPRIZE_SITE_MENTION}`;
  const prefixBudget = Math.max(0, max - suffix.length);
  const prefix =
    prefixBudget > 0 ? truncateMetaDescription(description, prefixBudget) : '';
  const merged = prefix ? `${prefix}${suffix}` : truncateMetaDescription(XPRIZE_SITE_MENTION, max);
  return merged.length <= max ? merged : truncateMetaDescription(merged, max);
}