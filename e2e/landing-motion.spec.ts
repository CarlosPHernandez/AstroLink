import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Landing search hero (Variation B)', () => {
  test.use({ storageState: emptyStorage });

  test('hero leads with Browse experts and a listed price', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('landing-hero-title')).toBeVisible();
    await expect(page.getByTestId('landing-hero-title')).toContainText(/1-on-1 with people who have done the work/i);
    await expect(page.getByTestId('landing-hero-proof')).toContainText(/\/ 15 min/i);
    await expect(page.getByTestId('landing-hero-experts-cta')).toBeVisible();
    await expect(page.getByTestId('landing-hero-assessment-cta')).toBeVisible();
    await expect(page.getByTestId('landing-hero-search')).toBeVisible();

    await expect(page.getByTestId('landing-goal-input')).toHaveCount(0);
    await expect(page.getByTestId('landing-hero-relay-expert')).toHaveCount(0);
    await expect(page.getByText(/Unlock access/i)).toHaveCount(0);
  });

  test('primary CTA navigates to /experts', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-experts-cta').click();
    await expect(page).toHaveURL(/\/experts/);
  });

  test('assessment CTA navigates to /assessment', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-assessment-cta').click();
    await expect(page).toHaveURL(/\/assessment/);
  });

  test('topic chips route to the directory, not the assessment', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-chips').getByRole('link', { name: 'Astronauts' }).click();
    await expect(page).toHaveURL(/\/experts\?topic=astronauts/);
  });

  test('hero search submits to /experts?q=', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-search').getByRole('textbox').fill('propulsion');
    await page.getByTestId('landing-hero-search').getByRole('button', { name: /search/i }).click();
    await expect(page).toHaveURL(/\/experts\?q=propulsion/);
  });

  test('rotating expert chat-preview card renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-expert-chat-preview')).toBeVisible();
  });

  test('top bar and assessment CTA card still present', async ({ page }) => {
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

  test('before/after comparison slider and review section are not on landing', async ({ page }) => {
    await page.goto('/');
    // Briefly resurrected in the 2026-08-10 redesign pass, then pulled per founder feedback.
    await expect(page.getByTestId('landing-comparison-slider')).toHaveCount(0);
    await expect(page.getByTestId('landing-reviews')).toHaveCount(0);
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

  test('mobile hero renders without full-viewport portrait stack', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const hero = page.getByTestId('landing-hero');
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(720);
    await expect(page.getByTestId('landing-hero-proof')).toBeVisible();
    await expect(page.getByTestId('landing-hero-experts-cta')).toBeVisible();
    await expect(page.getByTestId('site-header-browse-cta-mobile')).toBeVisible();
  });
});
