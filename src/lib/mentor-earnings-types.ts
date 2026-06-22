import type { BookingStatus } from '@/lib/types';

export type MentorEarningStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type MentorEarningsSummary = {
  totalGrossCents: number;
  totalPlatformFeeCents: number;
  recordedShareCents: number;
  awaitingTransferCents: number;
  transferredCents: number;
  refundedPayoutCents: number;
  sessionCount: number;
};

export type MentorTransferStatus = 'awaiting' | 'transferred' | 'not_applicable';

export type MentorEarningRow = {
  id: string;
  bookingId: string;
  menteeName: string;
  scheduledAt: string;
  bookingStatus: BookingStatus;
  grossCents: number;
  platformFeeCents: number;
  mentorPayoutCents: number;
  status: MentorEarningStatus;
  transferStatus: MentorTransferStatus;
  createdAt: string;
};
