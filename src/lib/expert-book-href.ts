/** Booking entry URL for a public expert — auth redirect when unsigned. */
export function getExpertBookHref(slug: string, isSignedIn: boolean): string {
  const bookingPath = `/booking?mentor=${encodeURIComponent(slug)}`;
  if (isSignedIn) {
    return bookingPath;
  }
  return `/auth?redirect=${encodeURIComponent(bookingPath)}`;
}
