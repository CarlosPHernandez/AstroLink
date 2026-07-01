import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}talk-with-chris`;
const E2E_GOALS = `${E2E_GOALS_TAG} Inspiration4 outreach strategy for STEM nonprofit`;
const STUB_OBJECTIVE = 'Validate lunar relay architecture options';

test.describe('Chris campaign landing → booking', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('landing CTA preserves ref through to booking URL', async ({ page }) => {
    await page.goto('/talk-with-chris?ref=chris-sembroski', { waitUntil: 'networkidle' });

    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();
    await expect(page).toHaveURL(/\/booking\?.*campaign=chris.*ref=chris-sembroski/);
  });

  test('landing CTA opens Chris booking with in-flow brief reveal', async ({ page }) => {
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

    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('chris-fulfillment-overlay')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('chris-segmented-progress')).toBeVisible();
    await expect(page.getByText(/authorizing payment/i)).toBeVisible();

    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
      { timeout: 90_000 },
    );
    expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();
    await expect(page.getByText(/generating your pre-call brief/i)).toBeVisible();

    const briefingModal = page.getByTestId('chris-briefing-modal');
    await expect(briefingModal).toBeVisible({ timeout: 90_000 });
    await expect(briefingModal.getByText(STUB_OBJECTIVE, { exact: true })).toBeVisible();

    await briefingModal.getByTestId('chris-brief-close').click();

    const nextSteps = page.getByTestId('chris-booking-next-steps');
    await expect(nextSteps).toBeVisible();
    await expect(nextSteps.getByText(/24 hours before your session/i)).toBeVisible();

    await page.getByTestId('chris-view-dashboard').click();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 30_000 });
  });
});