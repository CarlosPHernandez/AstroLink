import { test, expect } from '@playwright/test';
import { mentorAuthFile } from './fixtures/auth';
import { createStorageState } from './helpers/session-bootstrap';
import path from 'node:path';
import os from 'node:os';

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

  test('mentee session bootstrap lands on mentee dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: emptyStorage });
    const tempAuth = path.join(os.tmpdir(), `astrolink-e2e-mentee-${Date.now()}.json`);
    await createStorageState('mentee', tempAuth);
    await context.close();

    const authed = await browser.newContext({ storageState: tempAuth });
    const authedPage = await authed.newPage();
    await authedPage.goto('/dashboard/mentee');
    await expect(authedPage.getByRole('heading', { name: /Carlos Hernandez/ })).toBeVisible();
    await authed.close();
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

  test('signed-in home shows shell with expert teaser, not marketing hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('signed-in-home')).toBeVisible();
    await expect(page.getByTestId('signed-in-cta-book')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Book verified space experts/i })).toHaveCount(0);
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
  });

  test.describe('signed-out landing', () => {
    test.use({ storageState: emptyStorage });

    test('marketing landing shows hero and expert roster', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByTestId('signed-in-home')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /Book verified space experts/i })).toBeVisible();
      await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
      await expect(page.getByText('Chris Sembroski')).toBeVisible();
      await expect(page.getByTestId('expert-card-chris-sembroski')).toContainText('$250/hr');
    });
  });
});
