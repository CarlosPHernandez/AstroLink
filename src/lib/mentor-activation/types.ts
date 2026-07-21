export type MentorActivationStatus = 'pending' | 'active';

export type MentorPayoutMethod =
  | 'paypal'
  | 'zelle'
  | 'cashapp'
  | 'bank_manual'
  | 'unset';

export const MENTOR_PAYOUT_METHODS = [
  'paypal',
  'zelle',
  'cashapp',
  'bank_manual',
  'unset',
] as const satisfies readonly MentorPayoutMethod[];

export type MentorClaimTokenRow = {
  id: string;
  mentor_id: string;
  token_hash: string;
  email: string;
  expires_at: string;
  used_at: string | null;
  revoked_at?: string | null;
  created_by: string | null;
  created_at: string;
};

export type CreateInviteResult = {
  mentorId: string;
  email: string;
  expiresAt: string;
  /** Raw token — only for email construction; never log or return to clients in prod APIs. */
  rawToken: string;
};
