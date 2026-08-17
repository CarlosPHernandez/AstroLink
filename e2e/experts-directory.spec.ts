import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Experts directory', () => {
  test.use({ storageState: emptyStorage });

  test('landing links to full experts page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-all-experts').click();
    await expect(page).toHaveURL('/experts');
    await expect(
      page.getByRole('heading', { name: /Talk to people who.ve done the work/i }),
    ).toBeVisible();
  });

  test('click card opens detail and CTA routes to auth when signed out', async ({ page }) => {
    await page.goto('/experts');
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();

    await page.getByTestId('expert-card-chris-sembroski').click();

    const sheet = page.getByTestId('expert-detail-sheet');
    const panel = page.getByTestId('expert-detail-panel');
    await expect(sheet.or(panel)).toBeVisible({ timeout: 10_000 });

    // On mobile the sheet must allow the primary CTA (book button) to be visible
    // and reachable after the slide-up, even for long bios (the previous implementation
    // clipped content with no outer scroller and only an internal bio cap).
    await expect(page.getByTestId('expert-detail-book')).toBeVisible();

    await page.getByTestId('expert-detail-book').click();
    await expect(page).toHaveURL(/\/auth\?redirect=/);
    const url = new URL(page.url());
    const redirectTarget = decodeURIComponent(url.searchParams.get('redirect') ?? '');
    expect(redirectTarget).toContain('mentor=chris-sembroski');
  });
});
