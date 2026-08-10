import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Landing search hero (2026-08-10 redesign)', () => {
  test.use({ storageState: emptyStorage });

  test('hero leads with search + assessment CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('landing-hero-title')).toBeVisible();
    await expect(page.getByTestId('landing-hero-title')).toContainText(/talk to/i);
    await expect(page.getByTestId('landing-hero-search')).toBeVisible();
    await expect(page.getByTestId('landing-hero-assessment-cta')).toBeVisible();
    await expect(page.getByTestId('landing-hero-experts-cta')).toBeVisible();

    // Goal-form relay removed (low traction) — the new search bar is a different
    // feature (routes to /experts?q=), not the old chat-relay.
    await expect(page.getByTestId('landing-goal-input')).toHaveCount(0);
    await expect(page.getByTestId('landing-hero-relay-expert')).toHaveCount(0);
  });

  test('assessment CTA navigates to /assessment', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-hero-assessment-cta').click();
    await expect(page).toHaveURL(/\/assessment/);
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
    // Hero (headline + search + chips + CTAs) should not dominate multiple phone screens.
    // Threshold raised from the pre-redesign assessment-magnet hero to accommodate the
    // search bar + audience chips; re-tighten after visual QA if it renders smaller.
    expect(box!.height).toBeLessThan(1000);
  });
});
