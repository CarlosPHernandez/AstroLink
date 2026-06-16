import { test, type Page } from '@playwright/test';

/** Skip expert-picker tests when Supabase returns no listed mentors. */
export async function skipIfNoBookingExperts(page: Page) {
  const count = await page.locator('[data-testid^="booking-expert-"]').count();
  if (count === 0) {
    test.skip(
      true,
      'No listed mentors in Supabase (is_listed=true). Check NEXT_PUBLIC_SUPABASE_* and seed data.',
    );
  }
}