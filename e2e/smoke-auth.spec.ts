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
  });

  test('landing shows Chris Sembroski from Supabase roster', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
    await expect(page.getByText('Chris Sembroski')).toBeVisible();
    await expect(page.getByText('$320/hr')).toBeVisible();
  });
});
