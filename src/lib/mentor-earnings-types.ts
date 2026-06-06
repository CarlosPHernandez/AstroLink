import type { BookingStatus } from '@/lib/types';

export type MentorEarningStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type MentorEarningsSummary = {
  totalGrossCents: number;
  totalPlatformFeeCents: number;
  totalPayoutCents: number;
  pendingPayoutCents: number;
  completedPayoutCents: number;
  sessionCount: number;
};

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
  createdAt: string;
};
