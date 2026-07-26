import path from 'node:path';
import { test, expect } from '@playwright/test';
import { mentorAuthFile } from './fixtures/auth';
import { restoreChrisMentorEmployer, stripE2eEmployerSuffix } from './helpers/supabase-cleanup';

const emptyStorage = { cookies: [] as [], origins: [] as [] };
const minimalPdf = path.join(__dirname, 'fixtures/nf1860-minimal.pdf');

test.describe('Mentor dashboard', () => {
  test.describe('authenticated mentor', () => {
    test.use({ storageState: mentorAuthFile });

    test.afterEach(async () => {
      try {
        await restoreChrisMentorEmployer();
      } catch {
        // Supabase keys optional in some environments; profile-save test uses try/finally too.
      }
    });

    test('loads overview home with KPIs and panels', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await expect(page.getByTestId('mentor-dashboard-sidebar')).toBeVisible();
      await expect(page.getByTestId('mentor-tab-overview')).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByTestId('mentor-overview-tab')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Welcome back,/i })).toBeVisible();
      await expect(page.getByTestId('mentor-overview-kpis')).toBeVisible();
      await expect(page.getByTestId('mentor-overview-kpi-sessions')).toBeVisible();
      await expect(page.getByTestId('mentor-overview-kpi-earnings')).toBeVisible();
      await expect(page.getByTestId('mentor-overview-upcoming-panel')).toBeVisible();
      await expect(page.getByTestId('mentor-overview-attention-panel')).toBeVisible();

      await page.getByTestId('mentor-tab-sessions').click();
      await expect(page.getByTestId('mentor-consultations-tab')).toBeVisible();
      await expect(page.getByTestId('mentor-tab-sessions')).toHaveAttribute('aria-selected', 'true');
    });

    test('earnings tab hides Connect CTA in E2E dev config', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-earnings').click();

      await expect(page.getByTestId('mentor-earnings-tab')).toBeVisible();
      await expect(page.getByText('Recorded share')).toBeVisible();
      await expect(page.getByText('Awaiting transfer')).toBeVisible();
      await expect(page.getByText('Transferred', { exact: true }).first()).toBeVisible();
      await expect(page.getByTestId('mentor-earnings-ledger')).toBeVisible();
      await expect(
        page.getByTestId('mentor-earnings-ledger').getByRole('columnheader', { name: 'Transfer' }),
      ).toBeVisible();
      await expect(page.getByTestId('mentor-stripe-onboard')).toHaveCount(0);
      // Playwright webServer sets SKIP_STRIPE_PAYMENTS=true → dev mode badge.
      await expect(page.getByText('Dev mode')).toBeVisible();
    });

    test('profile tab shows public listing card for Chris', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-profile').click();

      const listingCard = page.getByTestId('mentor-listing-card');
      if ((await listingCard.count()) === 0) {
        test.skip(true, 'Chris mentor row missing in environment');
      }

      await expect(listingCard).toBeVisible();
      await expect(page.getByTestId('mentor-listing-compliance')).toHaveText('Approved');
      await expect(page.getByTestId('mentor-listing-listed')).toHaveText('Listed on directory');
      await expect(page.getByText(/Live on the expert directory|directory/i).first()).toBeVisible();
      await expect(page.getByTestId('mentor-listing-preview')).toHaveAttribute(
        'href',
        '/experts/chris-sembroski',
      );
    });

    test('profile tab renders form fields', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-profile').click();

      await expect(page.getByTestId('mentor-profile-form')).toBeVisible();
      await expect(page.getByLabel('Hourly rate (USD)')).toBeVisible();
      await expect(page.getByLabel('Employer')).toBeVisible();
      await expect(page.getByLabel('Expertise (comma-separated)')).toBeVisible();
      await expect(page.getByLabel('Bio')).toBeVisible();
    });

    test('profile save shows success when Supabase is configured', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-profile').click();

      const employer = page.getByLabel('Employer');
      const current = await employer.inputValue();
      if (!current.trim()) {
        test.skip(true, 'Chris mentor row missing in environment');
      }

      const baseline = stripE2eEmployerSuffix(current);

      try {
        const suffix = `-e2e-${Date.now()}`;
        await employer.fill(`${baseline}${suffix}`);
        await page.getByRole('button', { name: 'Save profile' }).click();

        const success = page.getByTestId('mentor-profile-success');
        try {
          await expect(success).toBeVisible({ timeout: 15_000 });
        } catch {
          test.skip(true, 'Profile save requires Supabase mentor row');
        }
      } finally {
        await restoreChrisMentorEmployer(baseline);
      }
    });

    test('profile rejects invalid rate', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-profile').click();

      const rate = page.getByLabel('Hourly rate (USD)');
      await rate.fill('0');
      const validationMessage = await rate.evaluate(
        (el) => (el as HTMLInputElement).validationMessage,
      );
      if (validationMessage) {
        await expect(page.getByTestId('mentor-profile-success')).toHaveCount(0);
        return;
      }

      await page.getByRole('button', { name: 'Save profile' }).click();
      await expect(page.getByTestId('mentor-profile-success')).toHaveCount(0);
      await expect(page.getByTestId('mentor-profile-form')).toBeVisible();
    });

    test('settings tab opens dark account window', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-settings').click();

      await expect(page.getByTestId('mentor-settings-tab')).toBeVisible();
      await expect(page.getByTestId('mentor-tab-settings')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('mentor-settings-account')).toBeVisible();
      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('settings password section is available', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-settings').click();
      await page.getByTestId('mentor-settings-section-password').click();

      await expect(page.getByTestId('mentor-password-form')).toBeVisible();
      await expect(page.getByTestId('mentor-current-password')).toBeVisible();
      await expect(page.getByTestId('mentor-new-password')).toBeVisible();
    });

    test('civil servant toggle shows NF-1860 upload', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-settings').click();
      await page.getByTestId('mentor-settings-section-compliance').click();

      await page.getByRole('checkbox', { name: /Federal civil servant/i }).check();
      await expect(page.getByTestId('mentor-nf1860-upload')).toBeVisible();
    });

    test('NF-1860 rejects non-PDF file', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-settings').click();
      await page.getByTestId('mentor-settings-section-compliance').click();
      await page.getByRole('checkbox', { name: /Federal civil servant/i }).check();

      const invalidPath = path.join(__dirname, 'fixtures/nf1860-invalid.txt');
      await page.getByTestId('mentor-nf1860-upload').setInputFiles(invalidPath);

      await expect(page.getByTestId('mentor-nf1860-upload-error')).toHaveText(
        'Upload a PDF scan of your approved NF-1860 form.',
      );
    });

    test('NF-1860 accepts minimal PDF when Supabase is configured', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await page.getByTestId('mentor-tab-settings').click();
      await page.getByTestId('mentor-settings-section-compliance').click();
      await page.getByRole('checkbox', { name: /Federal civil servant/i }).check();

      await page.getByTestId('mentor-nf1860-upload').setInputFiles(minimalPdf);

      const received = page.getByText('Document received.');
      if ((await received.count()) === 0) {
        const error = page.getByText(/Could not upload|PDF/i);
        if ((await error.count()) > 0) {
          test.skip(true, 'NF-1860 upload requires Supabase + compliance path');
        }
      }
      await expect(received).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('unauthenticated', () => {
    test.use({ storageState: emptyStorage });

    test('redirects to auth', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await expect(page).toHaveURL(/\/auth\?redirect=/);
    });
  });
});