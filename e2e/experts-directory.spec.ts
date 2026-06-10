import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Experts directory', () => {
  test.use({ storageState: emptyStorage });

  test('landing links to full experts page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-all-experts').click();
    await expect(page).toHaveURL('/experts');
    await expect(page.getByRole('heading', { name: /Browse aerospace experts/i })).toBeVisible();
  });

  test('click card opens detail and CTA routes to auth when signed out', async ({ page }) => {
    await page.goto('/experts');
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();

    await page.getByTestId('expert-card-chris-sembroski').click();

    const sheet = page.getByTestId('expert-detail-sheet');
    const panel = page.getByTestId('expert-detail-panel');
    await expect(sheet.or(panel)).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('expert-detail-book').click();
    await expect(page).toHaveURL(/\/auth\?redirect=/);
    const url = new URL(page.url());
    const redirectTarget = decodeURIComponent(url.searchParams.get('redirect') ?? '');
    expect(redirectTarget).toContain('mentor=chris-sembroski');
  });
});
