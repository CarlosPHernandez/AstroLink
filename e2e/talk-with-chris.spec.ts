import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}talk-with-chris`;
/** Must be ≥ CHRIS_GOALS_MIN_CHARS (50) for Chris hybrid goals validation. */
const E2E_GOALS = `${E2E_GOALS_TAG} Inspiration4 outreach strategy for STEM nonprofit launch plan`;
const STUB_OBJECTIVE = 'Validate lunar relay architecture options';

test.describe('Chris campaign landing → booking', () => {
  // Serial: shared E2E_GOALS_TAG cleanup must not race the full booking → briefing path.
  test.describe.configure({ mode: 'serial' });

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
    await expect(page.getByTestId('chris-landing-price').first()).toBeVisible();
    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();

    await expect(page).toHaveURL(/\/booking\?.*campaign=chris/);
    await expect(page.getByTestId('booking-chris-campaign')).toBeVisible();
    await expect(page.getByText('Book your call with Chris Sembroski')).toBeVisible();
    // Goals-first: signed-in mentee starts on session (not account).
    await expect(page.getByRole('heading', { name: 'Create your account' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'What do you want to cover?' })).toBeVisible();
    await expect(page.getByText(/\d+-minute live 1:1/i)).toBeVisible();
    await expect(page.locator('input[type="range"]')).toHaveCount(0);

    const scheduledAt = page.getByTestId('booking-scheduled-at');
    await scheduledAt.fill('2026-08-15T14:00');
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'Nonprofit director planning Inspiration4-style outreach for youth STEM programs.',
    );
    await page.getByTestId('booking-wizard-continue-session').click();

    // Signed-in: session → payment (no account step).
    await expect(page.getByTestId('booking-submit')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toHaveCount(0);

    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('chris-fulfillment-overlay')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('chris-segmented-progress')).toBeVisible();
    await expect(page.getByText(/processing payment/i)).toBeVisible();

    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
      { timeout: 90_000 },
    );
    expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();
    await expect(page.getByText(/generating your pre-call brief/i)).toBeVisible();

    const briefingModal = page.getByTestId('chris-briefing-modal');
    await expect(briefingModal).toBeVisible({ timeout: 90_000 });
    await expect(briefingModal.getByText(STUB_OBJECTIVE, { exact: true })).toBeVisible();

    let emailSendCount = 0;
    await page.route('**/api/book/briefing/email', async (route) => {
      emailSendCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    const emailButton = briefingModal.getByTestId('chris-brief-email');
    await expect(emailButton).toBeEnabled();
    await emailButton.click();
    await expect(emailButton).toHaveText('Send again');
    await expect(emailButton).toBeEnabled();
    await expect(briefingModal.getByText(/^Sent/)).toBeVisible();
    await emailButton.click();
    expect(emailSendCount).toBe(2);

    await briefingModal.getByTestId('chris-brief-close').click();

    const nextSteps = page.getByTestId('chris-booking-next-steps');
    await expect(nextSteps).toBeVisible();
    await expect(nextSteps.getByText(/24 hours before your session/i)).toBeVisible();

    await page.getByTestId('chris-view-dashboard').click();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 30_000 });
  });

  test('empty background still continues to payment when goals meet floor', async ({ page }) => {
    await page.goto('/talk-with-chris', { waitUntil: 'networkidle' });
    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();

    await expect(page.getByTestId('booking-goals')).toBeVisible();
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill('');
    await page.getByTestId('booking-wizard-continue-session').click();
    await expect(page.getByTestId('booking-submit')).toBeVisible();
  });

  test('short goals stay on session and do not advance to payment', async ({ page }) => {
    await page.goto('/talk-with-chris', { waitUntil: 'networkidle' });
    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();

    await expect(page.getByTestId('booking-goals')).toBeVisible();
    await page.getByTestId('booking-goals').fill('too short');
    await page.getByTestId('booking-wizard-continue-session').click();
    await expect(page.getByTestId('booking-submit')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'What do you want to cover?' })).toBeVisible();
  });

  test('restores Chris booking draft after reload', async ({ page }) => {
    await page.goto('/talk-with-chris', { waitUntil: 'networkidle' });
    await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();

    await expect(page.getByTestId('booking-goals')).toBeVisible();
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-wizard-continue-session').click();
    // Draft is saved on continue; signed-in users land on payment.
    await expect(page.getByTestId('booking-submit')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });

    // Complete draft + signed-in remounts on payment; banner only renders on session.
    await expect(page.getByTestId('booking-submit')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('chris-edit-session').click();
    await expect(page.getByTestId('chris-draft-restore-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('booking-goals')).toHaveValue(new RegExp(E2E_GOALS_TAG));
  });
});
