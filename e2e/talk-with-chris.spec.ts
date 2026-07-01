import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}talk-with-chris`;
const E2E_GOALS = `${E2E_GOALS_TAG} Inspiration4 outreach strategy for STEM nonprofit`;

test.describe('Chris campaign landing → booking', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('landing CTA opens Chris booking with 45-minute session', async ({ page }) => {
    await page.goto('/talk-with-chris', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('chris-landing-row')).toBeVisible();
    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();

    await expect(page).toHaveURL(/\/booking\?.*campaign=chris/);
    await expect(page.getByTestId('booking-chris-campaign')).toBeVisible();
    await expect(page.getByText('Book your call with Chris Sembroski')).toBeVisible();
    await expect(page.getByText(/45-minute live 1:1/i)).toBeVisible();
    await expect(page.locator('input[type="range"]')).toHaveCount(0);

    const scheduledAt = page.getByTestId('booking-scheduled-at');
    await scheduledAt.fill('2026-08-15T14:00');
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'Nonprofit director planning Inspiration4-style outreach for youth STEM programs.',
    );
    await page.getByTestId('booking-wizard-continue-session').click();

    await expect(page.getByTestId('booking-submit')).toBeVisible();

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