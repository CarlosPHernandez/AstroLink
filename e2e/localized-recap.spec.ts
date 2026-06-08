import { test, expect } from '@playwright/test';
import { deleteE2eBookingsForMentee, E2E_GOALS_PREFIX } from './helpers/supabase-cleanup';
import { futureDatetimeLocal } from './helpers/datetime';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}localized-recap`;
const E2E_GOALS = `${E2E_GOALS_TAG} localized recap pt-BR`;

test.describe('D3 Phase 2 localized recap', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('pt-BR mentee sees translated recap after meeting ends (D13)', async ({ page }) => {
    await page.goto('/booking?mentor=chris-sembroski', { waitUntil: 'networkidle' });

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill('E2E localized recap buyer.');

    const [bookResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(bookResponse.ok()).toBeTruthy();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });

    const bookedMatch = page.url().match(/booked=([0-9a-f-]{36})/i);
    const bookingId = bookedMatch?.[1];
    expect(bookingId).toBeTruthy();

    const simulateResponse = await page.request.post('/api/dev/session-operator', {
      data: { bookingId, action: 'simulate_meeting_ended' },
    });
    expect(simulateResponse.ok(), await simulateResponse.text()).toBeTruthy();
    const simulateBody = (await simulateResponse.json()) as {
      processed?: boolean;
      reason?: string;
      bookingId?: string;
    };
    expect(simulateBody.processed, simulateBody.reason ?? 'simulate_meeting_ended').toBe(true);
    expect(simulateBody.bookingId).toBe(bookingId);

    const recapResponse = await page.request.get(`/api/session/${bookingId}/recap`);
    expect(recapResponse.ok(), await recapResponse.text()).toBeTruthy();
    const recapBody = (await recapResponse.json()) as { ready?: boolean; recap?: unknown };
    expect(recapBody.ready, JSON.stringify(recapBody)).toBe(true);

    await page.goto(`/session/${bookingId}`);

    await expect(page.getByTestId('session-completed')).toBeVisible({ timeout: 60_000 });

    const recapContent = page.getByTestId('session-recap-content');
    await expect(recapContent).toBeVisible({ timeout: 60_000 });
    await expect(recapContent).toContainText('[pt-BR]');
  });
});
