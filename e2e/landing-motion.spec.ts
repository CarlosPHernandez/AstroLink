import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Landing assessment magnet', () => {
  test.use({ storageState: emptyStorage });

  test('hero leads with free assessment CTA and compact visual', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('landing-hero-title')).toBeVisible();
    await expect(page.getByTestId('landing-hero-title')).toContainText(/where you stand/i);
    await expect(page.getByTestId('landing-hero-assessment-cta')).toBeVisible();
    await expect(page.getByTestId('landing-hero-experts-cta')).toBeVisible();
    await expect(page.getByTestId('landing-hero-visual')).toBeVisible();
    await expect(page.getByTestId('landing-hero-steps')).toBeVisible();

    // Goal-form relay removed (low traction) — assessment is primary magnet
    await expect(page.getByTestId('landing-goal-input')).toHaveCount(0);
    await expect(page.getByTestId('landing-hero-relay-expert')).toHaveCount(0);
  });

  test('assessment CTA navigates to /assessment', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-assessment-cta').click();
    await expect(page).toHaveURL(/\/assessment/);
  });

  test('top bar and mid-page assessment offer still present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-assessment-bar')).toBeVisible();
    await expect(page.getByTestId('landing-assessment-bar-link')).toBeVisible();
    await page.getByTestId('landing-assessment-offer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('landing-assessment-offer-cta')).toBeVisible();
  });

  test('open directory shows expert names and browse path', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-all-experts').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
    await expect(page.getByTestId('expert-card-chris-sembroski')).toContainText(/Chris|Sembroski/i);
    await expect(page.getByTestId('view-all-experts')).toBeVisible();
    await page.getByTestId('view-all-experts').click();
    await expect(page).toHaveURL('/experts');
  });

  test('story scrub / comparison slider removed from landing', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-story-scrub')).toHaveCount(0);
    await expect(page.getByTestId('landing-comparison-slider')).toHaveCount(0);
  });

  test('mobile menu opens on landing and experts', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByTestId('site-mobile-menu')).toBeHidden();
    await page.getByTestId('site-mobile-menu-button').click();
    await expect(page.getByTestId('site-mobile-menu')).toBeVisible();
    await expect(page.getByTestId('site-mobile-menu').getByRole('link', { name: 'Experts' })).toBeVisible();
    await expect(page.getByTestId('site-mobile-menu').getByRole('link', { name: 'Press' })).toBeVisible();

    await page.goto('/experts');
    await page.getByTestId('site-mobile-menu-button').click();
    await expect(page.getByTestId('site-mobile-menu')).toBeVisible();
    await expect(page.getByTestId('product-site-header')).toBeVisible();
  });

  test('mobile hero stays compact (no full-viewport portrait stack)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const hero = page.getByTestId('landing-hero');
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    // Hero should not dominate multiple phone screens
    expect(box!.height).toBeLessThan(900);
  });
});
