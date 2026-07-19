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

  test('hero title uses rotating headline counter', async ({ page }) => {
    await page.goto('/');
    const title = page.getByTestId('landing-hero-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Talk to/i);
    await expect(page.getByTestId('landing-hero-headline-rotator')).toBeVisible();
    await expect(page.getByTestId('landing-hero-headline-active')).toBeVisible();
  });

  test('open directory shows expert names and browse path', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('view-all-experts').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('expert-card-chris-sembroski')).toBeVisible();
    await expect(page.getByTestId('expert-card-chris-sembroski')).toContainText(/Chris|Sembroski/i);
    await expect(page.getByTestId('view-all-experts')).toBeVisible();
    await expect(page.getByTestId('landing-trust')).toBeVisible();
    await page.getByTestId('view-all-experts').click();
    await expect(page).toHaveURL('/experts');
  });

  test('path chip submits student goal into expert relay', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-path-student').click();
    await expect(page.getByTestId('landing-hero-goal-active')).toBeVisible();
    await expect(page.getByTestId('landing-hero-user-message')).toContainText(/student/i);
    await expect(page.getByTestId('landing-hero-relay-expert')).toBeVisible();
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
      await expect(section).toBeVisible();

      // Wait for the client scroll hook to attach --landing-scroll-progress.
      await expect
        .poll(async () =>
          section.evaluate((el) =>
            getComputedStyle(el).getPropertyValue('--landing-scroll-progress').trim(),
          ),
        )
        .not.toBe('');

      await section.evaluate((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      });

      await expect
        .poll(async () => {
          const start = await section.evaluate((el) => {
            const generic = document.querySelector('.landing-story-generic-card');
            const expert = document.querySelector('.landing-story-expert-card');
            return {
              progress: getComputedStyle(el).getPropertyValue('--landing-scroll-progress').trim(),
              genericOpacity: generic ? getComputedStyle(generic).opacity : null,
              expertOpacity: expert ? getComputedStyle(expert).opacity : null,
            };
          });
          return (
            Number.parseFloat(start.progress) < 0.25 &&
            start.genericOpacity === '1' &&
            start.expertOpacity === '0'
          );
        })
        .toBe(true);

      await section.evaluate((el) => {
        const runway = Math.max(1, el.offsetHeight - window.innerHeight);
        window.scrollTo({ top: el.offsetTop + runway * 0.6, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      });

      await expect
        .poll(async () => {
          const mid = await section.evaluate((el) => {
            const expert = document.querySelector('.landing-story-expert-card');
            return {
              progress: getComputedStyle(el).getPropertyValue('--landing-scroll-progress').trim(),
              expertOpacity: expert ? getComputedStyle(expert).opacity : null,
            };
          });
          return (
            Number.parseFloat(mid.progress) > 0.5 &&
            Number.parseFloat(mid.expertOpacity ?? '0') > 0.8
          );
        })
        .toBe(true);
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