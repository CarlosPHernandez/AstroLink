import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

/** Chris is seeded in dev; partner landings use the same route for any listed slug. */
const JOIN_SLUG = 'chris-sembroski';
const JOIN_REFERRER = `expert-${JOIN_SLUG}`;

test.describe('Expert partner join landing', () => {
  test.use({ storageState: emptyStorage });

  test('renders expert hero, media, and signup form', async ({ page }) => {
    await page.goto(`/join/${JOIN_SLUG}`);
    await expect(page.getByTestId('join-expert-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Book a live 1:1 session with/i })).toBeVisible();
    await expect(page.getByTestId('join-expert-featured')).toBeVisible();
    await expect(page.getByTestId('early-access-form')).toBeVisible();
    await expect(page.getByRole('link', { name: 'All experts' })).toHaveAttribute(
      'href',
      '/early-access',
    );
  });

  test('signup attributes referrer for partner landing', async ({ page }) => {
    let postedBody: { email?: string; referrer?: string } | null = null;
    await page.route('**/api/early-access', async (route) => {
      postedBody = route.request().postDataJSON() as { email?: string; referrer?: string };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          alreadyRegistered: false,
          message: "You're on the list.",
        }),
      });
    });

    await page.goto(`/join/${JOIN_SLUG}`);
    await page.getByLabel('Email').fill('join-expert-e2e@example.com');
    await page.getByRole('button', { name: 'Get early access' }).click();

    await expect(page.getByTestId('early-access-success')).toBeVisible();
    expect(postedBody).toEqual({
      email: 'join-expert-e2e@example.com',
      referrer: JOIN_REFERRER,
      company: '',
    });
  });

  test('unknown slug shows not found', async ({ page }) => {
    await page.goto('/join/not-a-real-expert-slug');
    await expect(page.getByTestId('join-expert-page')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'This page is not on AstroLink.' }),
    ).toBeVisible();
  });
});