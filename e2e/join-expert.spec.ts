import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

const JOIN_SLUG = 'chris-sembroski';

test.describe('Retired expert partner join landing', () => {
  test.use({ storageState: emptyStorage });

  test('redirects join slug to talk-with-chris with expert ref', async ({ page }) => {
    await page.goto(`/join/${JOIN_SLUG}`);
    await expect(page).toHaveURL(
      new RegExp(`/talk-with-chris\\?ref=${encodeURIComponent(`expert-${JOIN_SLUG}`).replace(/-/g, '\\-')}`),
    );
    await expect(page.getByTestId('chris-landing-row')).toBeVisible();
  });
});