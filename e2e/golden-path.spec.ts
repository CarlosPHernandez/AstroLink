import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';
import { futureDatetimeLocal } from './helpers/datetime';

const E2E_GOALS = `${E2E_GOALS_PREFIX} lunar relay comms architecture review`;
const STUB_OBJECTIVE = 'Validate lunar relay architecture options';

test.describe('D1 golden path (skip Stripe)', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee();
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee();
  });

  test('book Chris, see APX-02 briefing, open session room', async ({ page }) => {
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
    await expect(bookingRow.getByText(E2E_GOALS)).toBeVisible();
    await expect(bookingRow.getByText('APX-02 session briefing')).toBeVisible();
    await expect(bookingRow.getByText(STUB_OBJECTIVE)).toBeVisible();

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
  });
});
