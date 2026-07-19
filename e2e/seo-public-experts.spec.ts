import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Public expert SEO surfaces', () => {
  test.use({ storageState: emptyStorage });

  test.describe('waitlist mode', () => {
    test.use({
      storageState: emptyStorage,
    });

    test('sitemap.xml returns XML, not early-access HTML', async ({ request }) => {
      test.skip(
        process.env.APP_MODE !== 'waitlist',
        'Requires APP_MODE=waitlist in the Playwright webServer env',
      );

      const response = await request.get('/sitemap.xml');
      expect(response.ok()).toBeTruthy();
      const body = await response.text();
      expect(body).toContain('<?xml');
      expect(body).toContain('<urlset');
      expect(body).not.toContain('Talk to astronauts');
    });
  });

  test('expert profile exposes astro-link.space canonical', async ({ page }) => {
    const response = await page.goto('/experts/chris-sembroski');
    expect(response?.status()).toBe(200);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /https:\/\/astro-link\.space\/experts\/chris-sembroski/);
  });

  test('experts directory is reachable and lists experts', async ({ page }) => {
    await page.goto('/experts');
    await expect(page.getByRole('heading', { name: /Aerospace experts/i })).toBeVisible();
  });

  test('robots.txt is served', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toMatch(/User-agent/i);
    // Local E2E runs the dev server (VERCEL_ENV !== production) — preview-safe disallow-all.
    expect(body).toContain('Disallow: /');
  });

  test('sitemap.xml includes expert profile URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('https://astro-link.space/experts');
    expect(body).toContain('/experts/chris-sembroski');
  });
});