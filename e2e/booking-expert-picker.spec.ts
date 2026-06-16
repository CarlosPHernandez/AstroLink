import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';
import { futureDatetimeLocal } from './helpers/datetime';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}booking-picker`;
const E2E_GOALS = `${E2E_GOALS_TAG} inline expert picker flow`;

test.describe('Booking expert picker', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('mobile sticky price bar updates after inline selection', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/booking', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('booking-mobile-price-bar')).toContainText(
      'Select an expert above',
    );

    await page.getByTestId('booking-expert-chris-sembroski').click();
    await expect(page).toHaveURL(/\/booking\?mentor=chris-sembroski/);

    const priceBar = page.getByTestId('booking-mobile-price-bar');
    await expect(priceBar).toContainText('Chris Sembroski');
    await expect(priceBar).toContainText('$125.10');
  });

  test('select expert inline on /booking without leaving the page', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();
    await expect(page.getByText('No expert selected')).toHaveCount(0);

    await page.getByTestId('booking-expert-chris-sembroski').click();

    await expect(page).toHaveURL(/\/booking\?mentor=chris-sembroski/);
    await expect(page.getByRole('heading', { name: 'Chris Sembroski' })).toBeVisible();
    await expect(page.locator('#booking-checkout-summary').getByText('$125.10')).toBeVisible();
    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'E2E buyer — testing inline expert picker on booking page.',
    );

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });
  });
});