export function canRefreshBriefing(params: {
  sessionUserId: string;
  sessionRole: string;
  bookingMenteeId: string;
  bookingMentorId: string;
}): boolean {
  return (
    params.bookingMenteeId === params.sessionUserId ||
    params.bookingMentorId === params.sessionUserId ||
    params.sessionRole === 'admin'
  );
}