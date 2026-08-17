import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';
import { confirmCaptionLanguage } from './helpers/caption-language';
import { futureDatetimeLocal } from './helpers/datetime';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}golden-path`;
const E2E_GOALS = `${E2E_GOALS_TAG} lunar relay comms architecture review`;
const STUB_OBJECTIVE = 'Validate lunar relay architecture options';
const STUB_PERSONAL_INTRO = 'Based on your goal to validate lunar relay architecture options';

test.describe('D1 golden path (skip Stripe)', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('book Chris, see session brief, open session room', async ({ page }) => {
    await page.goto('/booking?mentor=chris-sembroski', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Chris Sembroski' })).toBeVisible();
    await expect(page.getByText('No expert selected')).toHaveCount(0);
    await expect(page.getByTestId('booking-submit')).toBeVisible();

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'E2E buyer — systems engineer exploring commercial relay options.',
    );

    await expect(page.getByTestId('booking-scheduled-at')).toHaveValue(scheduledAt);
    await expect(page.getByTestId('booking-goals')).toHaveValue(E2E_GOALS);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();

    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });

    const bookedMatch = page.url().match(/booked=([0-9a-f-]{36})/i);
    const bookingId = bookedMatch?.[1];
    expect(bookingId).toBeTruthy();

    const bookingRow = page.getByTestId(`booking-row-${bookingId}`);
    await expect(bookingRow).toBeVisible();
    await expect(bookingRow.getByText('Chris Sembroski')).toBeVisible();

    const briefingSidebar = page.getByTestId('briefing-sidebar');
    await expect(briefingSidebar).toBeVisible();
    await expect(briefingSidebar.getByRole('heading', { name: 'Pre-session brief' })).toBeVisible();
    // exact: true — "Pre-session brief" contains substring "Session brief"
    await expect(briefingSidebar.getByText('Session brief', { exact: true })).toBeVisible();
    await expect(page.getByText(STUB_PERSONAL_INTRO)).toBeVisible();
    await expect(page.getByText(STUB_OBJECTIVE)).toBeVisible();

    await page.getByRole('button', { name: 'Close briefing panel' }).click();

    const joinLink = page.getByTestId(`booking-join-${bookingId}`);
    if (await joinLink.isVisible()) {
      await joinLink.click();
    } else {
      await page.goto(`/session/${bookingId}`);
    }

    await expect(page).toHaveURL(new RegExp(`/session/${bookingId}`));
    await expect(page.getByTestId('session-mentor-name')).toContainText('Chris Sembroski');
    await expect(page.getByText(STUB_OBJECTIVE)).toBeVisible();
    await expect(page.getByTestId('session-exit')).toBeVisible();

    const joinReady = page.getByTestId('session-join-ready');
    const provisioning = page.getByTestId('session-provisioning');
    const tokenError = page.getByTestId('session-token-error');

    if (await joinReady.isVisible()) {
      await confirmCaptionLanguage(page);
      await expect(page.locator('[data-testid="session-daily-call"]')).toBeVisible();
    } else if (await provisioning.isVisible()) {
      await expect(provisioning).toContainText(/Room preparing|Preparing room/i);
    } else if (await tokenError.isVisible()) {
      await expect(tokenError).toBeVisible();
    }

    await expect(page.locator('.bg-background')).toBeVisible();
  });
});
