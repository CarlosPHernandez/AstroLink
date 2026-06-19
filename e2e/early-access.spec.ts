import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Early access waitlist', () => {
  test.use({ storageState: emptyStorage });

  test('renders focused hero, signup form, and Experts nav in full mode', async ({ page }) => {
    await page.goto('/early-access');
    await expect(
      page.getByRole('heading', { name: /Talk to astronauts/i }),
    ).toBeVisible();
    await expect(page.getByTestId('early-access-form')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get early access' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Experts' })).toBeVisible();
    await expect(page.getByText(/One email when booking opens/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('signup form fits above the fold on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/early-access');
    const form = page.getByTestId('early-access-form');
    await expect(form).toBeVisible();
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  });

  test('shows validation error for invalid email without calling API', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/early-access', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/early-access');
    // Use a value that passes native type=email but fails app validation (no TLD dot).
    await page.getByLabel('Email').fill('waitlist@invalid');
    await page.getByRole('button', { name: 'Get early access' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByTestId('early-access-success')).toHaveCount(0);
    expect(apiCalled).toBe(false);
  });

  test('successful signup shows success headline and body', async ({ page }) => {
    await page.route('**/api/early-access', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, alreadyRegistered: false }),
      });
    });

    await page.goto('/early-access');
    await page.getByLabel('Email').fill('waitlist-e2e-new@example.com');
    await page.getByRole('button', { name: 'Get early access' }).click();

    await expect(page.getByTestId('early-access-success')).toBeVisible();
    await expect(page.getByText("You're on the list")).toBeVisible();
    await expect(
      page.getByText("We'll reach out when early access opens."),
    ).toBeVisible();
    await expect(page.getByTestId('early-access-form')).toHaveCount(0);
  });

  test('duplicate signup shows the same success copy as a new signup', async ({ page }) => {
    await page.route('**/api/early-access', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: "You're on the list. We'll reach out when early access opens.",
        }),
      });
    });

    await page.goto('/early-access');
    await page.getByLabel('Email').fill('waitlist-e2e-dup@example.com');
    await page.getByRole('button', { name: 'Get early access' }).click();

    await expect(page.getByTestId('early-access-success')).toBeVisible();
    await expect(page.getByText("You're on the list")).toBeVisible();
    await expect(
      page.getByText("We'll reach out when early access opens."),
    ).toBeVisible();
  });

  test('add another email restores the signup form', async ({ page }) => {
    await page.route('**/api/early-access', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, alreadyRegistered: false }),
      });
    });

    await page.goto('/early-access');
    await page.getByLabel('Email').fill('waitlist-e2e-reset@example.com');
    await page.getByRole('button', { name: 'Get early access' }).click();
    await expect(page.getByTestId('early-access-success')).toBeVisible();

    await page.getByRole('button', { name: 'Add another email' }).click();
    await expect(page.getByTestId('early-access-form')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('');
  });

  test('posts referrer from ref query param', async ({ page }) => {
    let postedBody: { email?: string; referrer?: string } | null = null;
    await page.route('**/api/early-access', async (route) => {
      postedBody = route.request().postDataJSON() as {
        email?: string;
        referrer?: string;
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, alreadyRegistered: false }),
      });
    });

    await page.goto('/early-access?ref=linkedin-jun-2026');
    await page.getByLabel('Email').fill('waitlist-e2e-ref@example.com');
    await page.getByRole('button', { name: 'Get early access' }).click();

    await expect(page.getByTestId('early-access-success')).toBeVisible();
    expect(postedBody).toMatchObject({
      email: 'waitlist-e2e-ref@example.com',
      referrer: 'linkedin-jun-2026',
    });
  });

  test('roster teaser lists public experts when Supabase is configured', async ({ page }) => {
    await page.goto('/early-access');
    const roster = page.getByTestId('early-access-roster');
    const rosterCount = await roster.count();
    if (rosterCount === 0) {
      test.skip(true, 'No listed mentors in environment — roster hidden by design');
    }

    await expect(page.getByRole('heading', { name: 'On the roster' })).toBeVisible();
    expect(await page.getByTestId(/roster-expert-/).count()).toBeGreaterThan(0);

    const chrisFeatured = page.getByTestId('roster-featured-chris-sembroski');
    if ((await chrisFeatured.count()) > 0) {
      await expect(chrisFeatured).toBeVisible();
      await expect(chrisFeatured.getByText('Chris Sembroski')).toBeVisible();
      await expect(
        chrisFeatured.getByRole('button', { name: /Play introduction video/i }),
      ).toBeVisible();
    }
  });
});