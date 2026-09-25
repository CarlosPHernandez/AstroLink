import { test, expect } from '@playwright/test';

const emptyStorage = { cookies: [] as [], origins: [] as [] };

const SUCCESS =
  'Application received. If we move forward, you will get an email to finish setup. AstroLink reviews every application before an expert appears in the directory.';

test.describe('Public expert application', () => {
  test.use({ storageState: emptyStorage });

  test('submits a valid application and shows the success sentence', async ({ page }) => {
    await page.route('**/api/expert-applications', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      const body = route.request().postDataJSON() as {
        fullName: string;
        hourlyRateDollars: number;
        services: string[];
        videoRequest: { enabled: boolean };
        timezone: string;
        windows: { weekday: number; startMinute: number; endMinute: number }[];
        isCivilServant: boolean;
      };
      expect(body.fullName).toBe('Avery Quinn');
      expect(body.hourlyRateDollars).toBe(150);
      expect(body.services).toEqual(['session_1on1']);
      expect(body.videoRequest).toEqual({ enabled: false });
      expect(body.timezone).toBe('America/Chicago');
      expect(body.windows).toEqual([{ weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 }]);
      expect(body.isCivilServant).toBe(false);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/for-experts');
    await expect(page.getByRole('heading', { name: 'Teach what you have already done.' })).toBeVisible();
    const form = page.getByTestId('expert-apply-form');
    await expect(form).toHaveAttribute('data-hydrated', 'true');

    await page.getByLabel('Full name').fill('Avery Quinn');
    await page.getByLabel('Email').fill('avery@example.com');
    await page.getByLabel('Employer').fill('JSC');
    await page.getByLabel('Expertise').fill('Guidance, navigation');
    await page.getByLabel('Bio').fill('Ten years on crewed vehicle guidance.');
    await page.getByLabel('Hourly rate (USD)').fill('150');
    await page.getByRole('checkbox', { name: 'Live 1:1' }).check();
    await page.getByLabel('Timezone').selectOption('America/Chicago');

    const tuesday = page.getByRole('group', { name: 'Tuesday' });
    await tuesday.getByLabel('Start').fill('09:00');
    await tuesday.getByLabel('End').fill('12:00');

    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByText(SUCCESS)).toBeVisible();
  });

  test('does not send a request when the name is empty', async ({ page }) => {
    await page.goto('/for-experts');
    const form = page.getByTestId('expert-apply-form');
    await expect(form).toHaveAttribute('data-hydrated', 'true');

    const requestSent = page
      .waitForRequest(
        (request) =>
          request.method() === 'POST' && request.url().includes('/api/expert-applications'),
        { timeout: 1_500 },
      )
      .then(() => true)
      .catch((error: unknown) => {
        if (error instanceof Error && /timeout/i.test(error.message)) return false;
        throw error;
      });

    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(requestSent).resolves.toBe(false);
  });
});
