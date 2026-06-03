import { test, expect } from '@playwright/test';
import { mentorAuthFile } from './fixtures/auth';
import { loginWithPreset } from './helpers/login';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Auth and landing smoke', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: emptyStorage });

    test('redirects unauthenticated users from mentee dashboard to auth', async ({ page }) => {
      await page.goto('/dashboard/mentee');
      await expect(page).toHaveURL(/\/auth\?redirect=/);
    });

    test('preserves booking query string in auth redirect', async ({ page }) => {
      await page.goto('/booking?mentor=chris-sembroski');
      await expect(page).toHaveURL(/\/auth\?redirect=/);
      const url = new URL(page.url());
      const redirectTarget = decodeURIComponent(url.searchParams.get('redirect') ?? '');
      expect(redirectTarget).toContain('mentor=chris-sembroski');
    });

    test('auth back to home link navigates to landing', async ({ page }) => {
      await page.goto('/auth');
      await page.getByTestId('auth-back-to-home').click();
      await expect(page).toHaveURL('/');
    });

    test('login honors redirect param to booking', async ({ page }) => {
      await page.goto('/auth?redirect=%2Fbooking%3Fmentor%3Dchris-sembroski');
      await page.locator('#email').fill('carlos@astrolink.ai');
      await page.locator('#password').fill('password123');
      await Promise.all([
        page.waitForURL('**/booking?mentor=chris-sembroski**', { timeout: 60_000 }),
        page.getByRole('button', { name: /Sign In/i }).click(),
      ]);
    });
  });

  test('mentee preset lands on mentee dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: emptyStorage });
    const page = await context.newPage();

    await loginWithPreset(page, 'auth-preset-mentee', 'mentee');
    await expect(page.getByRole('heading', { name: /Carlos Hernandez/ })).toBeVisible();

    await context.close();
  });

  test.describe('mentor role guard', () => {
    test.use({ storageState: mentorAuthFile });

    test('mentor cannot access mentee dashboard', async ({ page }) => {
      await page.goto('/dashboard/mentee');
      await expect(page).toHaveURL(/\/dashboard\/mentor/);
    });

    test('redirects authenticated users away from auth', async ({ page }) => {
      await page.goto('/auth');
      await expect(page).toHaveURL(/\/dashboard\/mentor/);
    });
  });

  test('landing shows Chris Sembroski from Supabase roster', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
    await expect(page.getByText('Chris Sembroski')).toBeVisible();
    await expect(page.getByText('$320/hr')).toBeVisible();
  });

  test('expert name links to public profile page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('expert-profile-link-chris-sembroski').click();
    await expect(page).toHaveURL(/\/experts\/chris-sembroski/);
    await expect(page.getByTestId('expert-profile-name')).toHaveText('Chris Sembroski');
    await expect(page.getByTestId('expert-ask-input')).toBeVisible();
  });

  test('meet preview expands on landing directory', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('expert-preview-chris-sembroski').click();
    await expect(page.getByTestId('expert-preview-chris-sembroski')).toHaveText(/Close/i);
    await expect(page.getByTestId('expert-preview-panel-chris-sembroski')).toBeVisible();
  });
});
