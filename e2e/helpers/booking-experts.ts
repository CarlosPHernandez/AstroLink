import { expect, test, type Page } from '@playwright/test';

/** Skip expert-picker tests when Supabase returns no listed mentors. */
export async function skipIfNoBookingExperts(page: Page) {
  const choose = page.getByTestId('booking-choose-expert');
  const openedBrowse = await choose.isVisible().catch(() => false);
  if (openedBrowse) {
    await choose.click();
  }

  const expertCards = page.locator(
    '[data-testid^="booking-expert-"]:not([data-testid="booking-expert-picker"])',
  );
  const count = await expertCards.count();
  if (count === 0) {
    test.skip(
      true,
      'No listed mentors in Supabase (is_listed=true). Check NEXT_PUBLIC_SUPABASE_* and seed data.',
    );
  }

  if (openedBrowse) {
    const useGemini = page.getByTestId('booking-use-gemini-match');
    if (await useGemini.isVisible().catch(() => false)) {
      await useGemini.click();
      await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);
    }
  }
}