import { test, expect } from '@playwright/test';
import { skipIfNoBookingExperts } from './helpers/booking-experts';
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
    await skipIfNoBookingExperts(page);

    await expect(page.getByTestId('booking-mobile-price-bar')).toContainText(
      'Gemini matches you after you submit',
    );

    await page.getByTestId('booking-choose-expert').click();
    await page.getByTestId('booking-expert-chris-sembroski').click();
    await expect(page).toHaveURL(/\/booking\?mentor=chris-sembroski/);

    const priceBar = page.getByTestId('booking-mobile-price-bar');
    await expect(priceBar).toContainText('Chris Sembroski');
    await expect(priceBar).toContainText('$125.10');
  });

  test('select expert inline on /booking without leaving the page', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);
    await page.getByTestId('booking-choose-expert').click();
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

  test('category filter shows empty state when no experts match', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await page.getByTestId('booking-choose-expert').click();

    const categories = ['Policy', 'Training', 'Spacecraft'] as const;
    let sawEmpty = false;
    for (const cat of categories) {
      await page.getByRole('button', { name: cat, exact: true }).click();
      const empty = page.getByText('No listed experts in this category right now.');
      if (await empty.isVisible()) {
        sawEmpty = true;
        break;
      }
    }

    expect(sawEmpty, 'Expected at least one category with no listed experts').toBe(true);
  });

  test('category filter clears selection when expert is filtered out of the picker', async ({
    page,
  }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await page.getByTestId('booking-choose-expert').click();
    await page.getByTestId('booking-expert-chris-sembroski').click();
    await expect(page.getByRole('heading', { name: 'Chris Sembroski' })).toBeVisible();

    await page.getByRole('button', { name: 'Change expert' }).click();
    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();

    await page.getByRole('button', { name: 'policy', exact: true }).click();

    await expect(page).toHaveURL('/booking');
    await expect(page.getByRole('heading', { name: 'Book a live session' })).toBeVisible();

    const chrisCard = page.getByTestId('booking-expert-chris-sembroski');
    if ((await chrisCard.count()) > 0) {
      await expect(chrisCard).not.toHaveAttribute('aria-pressed', 'true');
    } else {
      await expect(page.getByText('No listed experts in this category right now.')).toBeVisible();
    }
  });

  test('unknown mentor slug shows alert and keeps picker open', async ({ page }) => {
    await page.goto('/booking?mentor=nonexistent-slug', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();
    await expect(page.getByTestId('booking-expert-picker')).toContainText('nonexistent-slug');
    await expect(page.getByRole('heading', { name: 'Book a live session' })).toBeVisible();
  });

  test('change expert reopens picker and allows a new selection', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await page.getByTestId('booking-choose-expert').click();
    await page.getByTestId('booking-expert-chris-sembroski').click();
    await expect(page.getByRole('heading', { name: 'Chris Sembroski' })).toBeVisible();
    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);

    await page.getByRole('button', { name: 'Change expert' }).click();

    await expect(page).toHaveURL('/booking');
    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Book a live session' })).toBeVisible();

    const carlosCard = page.getByTestId('booking-expert-carlos-hernandez');
    if ((await carlosCard.count()) === 0) {
      test.skip(true, 'carlos-hernandez mentor not listed in Supabase.');
    }

    await carlosCard.click();
    await expect(page).toHaveURL(/\/booking\?mentor=carlos-hernandez/);
    await expect(page.getByRole('heading', { name: 'Carlos Hernandez' })).toBeVisible();
    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);
  });

  test('use Gemini match instead hides the picker again', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await page.getByTestId('booking-choose-expert').click();
    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();

    await page.getByTestId('booking-use-gemini-match').click();
    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);
    await expect(page.getByTestId('booking-choose-expert')).toBeVisible();
    await expect(page.getByTestId('booking-submit')).toContainText(/Match me/);
  });

  test('match failure shows an honest error and opens browse', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await page.route('**/api/book', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error:
            'Gemini could not match you to a listed expert from these goals. Add more detail, or choose someone from the directory.',
          code: 'match_failed',
        }),
      });
    });

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'E2E — honest match fail should open the directory picker.',
    );
    await page.getByTestId('booking-submit').click();

    await expect(
      page.getByText('Gemini could not match you to a listed expert from these goals'),
    ).toBeVisible();
    await expect(page.getByTestId('booking-expert-picker')).toBeVisible();
    await expect(page).toHaveURL(/\/booking/);
  });

  test('submit without expert lets Gemini match and completes booking', async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'networkidle' });
    await skipIfNoBookingExperts(page);

    await expect(page.getByTestId('booking-expert-picker')).toHaveCount(0);
    await expect(page.getByTestId('booking-choose-expert')).toBeVisible();

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill(
      'E2E — default Gemini match path without picking an expert.',
    );

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();
    const body = (await response.json()) as {
      data?: { matchedByGemini?: boolean; mentorId?: string };
    };
    expect(body.data?.matchedByGemini).toBe(true);
    expect(body.data?.mentorId).toBeTruthy();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });
  });
});