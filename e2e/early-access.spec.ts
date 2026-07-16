import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Retired early-access waitlist', () => {
  test.use({ storageState: emptyStorage });

  test('redirects /early-access to talk-with-chris', async ({ page }) => {
    await page.goto('/early-access');
    await expect(page).toHaveURL(/\/talk-with-chris/);
    await expect(page.getByTestId('chris-landing-row')).toBeVisible();
  });

  test('preserves ref query when redirecting from early-access', async ({ page }) => {
    await page.goto('/early-access?ref=linkedin-jun-2026');
    await expect(page).toHaveURL(/\/talk-with-chris\?ref=linkedin-jun-2026/);
  });

  test('redirects /early-access/player to talk-with-chris', async ({ page }) => {
    await page.goto('/early-access/player');
    await expect(page).toHaveURL(/\/talk-with-chris/);
  });

  test('POST /api/early-access returns 410 Gone', async ({ request }) => {
    const response = await request.post('/api/early-access', {
      data: { email: 'retired-waitlist@example.com', company: '' },
    });
    expect(response.status()).toBe(410);
    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/closed/i);
  });
});