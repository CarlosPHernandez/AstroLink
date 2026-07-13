import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

test.describe('Landing motion redesign', () => {
  test.use({ storageState: emptyStorage });

  test('goal submit shows expert relay without harsh unlock panel', async ({ page }) => {
    await page.goto('/');

    const goal = 'How do I become an astronaut?';
    await page.getByTestId('landing-goal-input').fill(goal);
    await page.getByTestId('landing-goal-submit').click();

    await expect(page.getByTestId('landing-hero-goal-active')).toBeVisible();
    await expect(page.getByTestId('landing-hero-user-message')).toContainText(goal);
    await expect(page.getByTestId('landing-hero-relay-expert')).toBeVisible();
    await expect(page.getByTestId('landing-hero-relay-expert')).toContainText(/Chris|Sembroski/i);

    const hero = page.locator('section').filter({ has: page.getByTestId('landing-hero-title') });
    await expect(hero.getByRole('button', { name: /unlock access/i })).toHaveCount(0);
    await expect(hero.getByRole('heading', { name: /unlock/i })).toHaveCount(0);

    await expect(page.getByTestId('landing-hero-journey-cta')).toBeVisible({ timeout: 20_000 });
  });

  test('propulsion goal routes to Eiman Jahangir', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-goal-input').fill('I want to learn about rocket propulsion systems');
    await page.getByTestId('landing-goal-submit').click();
    await expect(page.getByTestId('landing-hero-relay-expert')).toContainText(/Eiman|Jahangir/i);
  });

  test('goal prompt input and submit are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-goal-input')).toBeVisible();
    await expect(page.getByTestId('landing-goal-submit')).toBeVisible();
    await expect(page.locator('.landing-hero-prompt-eyebrow')).toHaveCount(0);
  });

  test.describe('story section', () => {
    test('desktop scroll-scrub stage is present', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.getByTestId('landing-story-scrub').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('landing-story-scrub-desktop')).toBeVisible();
      await expect(page.getByTestId('landing-comparison-slider')).toBeHidden();
    });

    test('desktop scroll progress crossfades generic to expert', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      const section = page.getByTestId('landing-story-scrub');

      await section.evaluate((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: 'instant' });
      });

      const start = await section.evaluate(() => {
        const generic = document.querySelector('.landing-story-generic-card');
        const expert = document.querySelector('.landing-story-expert-card');
        return {
          progress: getComputedStyle(document.querySelector('[data-testid="landing-story-scrub"]')!)
            .getPropertyValue('--landing-scroll-progress')
            .trim(),
          genericOpacity: generic ? getComputedStyle(generic).opacity : null,
          expertOpacity: expert ? getComputedStyle(expert).opacity : null,
        };
      });

      expect(Number.parseFloat(start.progress)).toBeLessThan(0.25);
      expect(start.genericOpacity).toBe('1');
      expect(start.expertOpacity).toBe('0');

      await section.evaluate((el) => {
        const runway = Math.max(1, el.offsetHeight - window.innerHeight);
        window.scrollTo({ top: el.offsetTop + runway * 0.6, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      });

      await page.waitForTimeout(150);

      const mid = await section.evaluate(() => {
        const expert = document.querySelector('.landing-story-expert-card');
        return {
          progress: getComputedStyle(document.querySelector('[data-testid="landing-story-scrub"]')!)
            .getPropertyValue('--landing-scroll-progress')
            .trim(),
          expertOpacity: expert ? getComputedStyle(expert).opacity : null,
        };
      });

      expect(Number.parseFloat(mid.progress)).toBeGreaterThan(0.5);
      expect(Number.parseFloat(mid.expertOpacity ?? '0')).toBeGreaterThan(0.8);
    });

    test('mobile comparison slider is present', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.getByTestId('landing-comparison-slider').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('landing-comparison-slider')).toBeVisible();
      await expect(page.getByTestId('landing-story-scrub-desktop')).toBeHidden();

      const range = page.getByTestId('landing-comparison-range');
      await range.fill('75');
      await expect(range).toHaveValue('75');
    });
  });

  test('prefers-reduced-motion uses static story layout on desktop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('landing-story-scrub').scrollIntoViewIfNeeded();

    const staticStory = page.getByTestId('landing-story-static');
    await expect(staticStory).toBeVisible();
    await expect(page.getByTestId('landing-story-scrub-desktop')).toHaveCount(0);
    await expect(staticStory.getByTestId('landing-story-generic-card')).toBeVisible();
    await expect(staticStory.getByTestId('landing-story-expert-card')).toBeVisible();
  });
});