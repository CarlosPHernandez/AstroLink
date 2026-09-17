import { test, expect } from '@playwright/test';
import { menteeAuthFile, mentorAuthFile } from './fixtures/auth';
import {
  deleteE2eBookingsForMentee,
  E2E_GOALS_PREFIX,
} from './helpers/supabase-cleanup';
import { futureDatetimeLocal } from './helpers/datetime';
import {
  deleteMentorOffers,
  E2E_MENTOR_EMAIL,
  E2E_OFFER_TITLE_PREFIX,
  hasSupabaseAdminEnv,
  isMissingExpertOffersRelation,
  probeExpertOffersTable,
  readMentorOfferFlags,
  setMentorExpertOffersEnabled,
  setMentorStripeOnboardingCompleted,
  type MentorOfferFlags,
} from './helpers/expert-offers';

const OFFER_TITLE = `${E2E_OFFER_TITLE_PREFIX} Strategy working session`;
const OFFER_DESCRIPTION =
  'E2E packaged session for strategy working: live video review of goals and constraints.';
const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}expert-offers`;
const E2E_GOALS = `${E2E_GOALS_TAG} packaged session checkout`;
const emptyStorage = { cookies: [] as [], origins: [] as [] };

let flagSnapshot: MentorOfferFlags | null = null;
let didMutateMentor = false;
let publicOfferPath = '';

test.describe.configure({ mode: 'serial' });

function skipIfMissingRelation(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  if (isMissingExpertOffersRelation(message)) {
    test.skip(true, `expert_offers table not found (hosted migration unapplied): ${message}`);
  }
}

test.describe('Expert offers demand path', () => {
  test('homepage and /experts do not list packaged sessions or the e2e offer', async ({
    page,
  }) => {
    for (const path of ['/', '/experts']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Packaged sessions')).toHaveCount(0);
      await expect(page.getByText(OFFER_TITLE)).toHaveCount(0);
    }
  });

  test.describe('create → public → book', () => {
    test.beforeAll(async () => {
      if (!hasSupabaseAdminEnv()) {
        test.skip(true, 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      }

      try {
        await probeExpertOffersTable();
      } catch (error) {
        skipIfMissingRelation(error);
        throw error;
      }

      try {
        await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
        await deleteMentorOffers(E2E_MENTOR_EMAIL);
        flagSnapshot = await readMentorOfferFlags(E2E_MENTOR_EMAIL);
        if (!flagSnapshot) {
          test.skip(true, `E2E mentor ${E2E_MENTOR_EMAIL} missing in Supabase`);
        }
        await setMentorExpertOffersEnabled(E2E_MENTOR_EMAIL, true);
        didMutateMentor = true;
        // Seed Chris is stripe_onboarding_completed=false; publish requires payout setup.
        await setMentorStripeOnboardingCompleted(E2E_MENTOR_EMAIL, true);
      } catch (error) {
        skipIfMissingRelation(error);
        throw error;
      }
    });

    test.afterAll(async () => {
      if (!hasSupabaseAdminEnv()) return;

      try {
        await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
      } catch {
        // Keys/table optional on teardown.
      }

      try {
        await deleteMentorOffers(E2E_MENTOR_EMAIL);
      } catch {
        // Hosted migration may be unapplied.
      }

      if (!didMutateMentor || !flagSnapshot) return;

      await setMentorExpertOffersEnabled(E2E_MENTOR_EMAIL, flagSnapshot.expert_offers_enabled);
      await setMentorStripeOnboardingCompleted(
        E2E_MENTOR_EMAIL,
        flagSnapshot.stripe_onboarding_completed,
      );
    });

    test.describe('authenticated mentor', () => {
      test.use({ storageState: mentorAuthFile });

      test('creates, publishes, and shares a public URL', async ({ page, browser }) => {
        await page.goto('/dashboard/mentor');
        await expect(page.getByTestId('mentor-dashboard-sidebar')).toBeVisible();

        const offersTab = page.getByTestId('mentor-tab-offers');
        await expect(offersTab).toBeVisible();
        await offersTab.click();
        await expect(page.getByTestId('mentor-offers-tab')).toBeVisible();

        const loadError = page.getByRole('alert');
        if ((await loadError.count()) > 0) {
          const text = (await loadError.textContent()) ?? '';
          if (isMissingExpertOffersRelation(text)) {
            test.skip(true, `expert_offers table not found (hosted migration unapplied): ${text}`);
          }
        }

        await expect(page.getByText('Loading…')).toHaveCount(0);
        await page.getByRole('button', { name: 'Create session' }).first().click();
        await expect(page.getByTestId('mentor-offer-form')).toBeVisible();

        await page.locator('#mentor-offer-title').fill(OFFER_TITLE);
        await page.locator('#mentor-offer-description').fill(OFFER_DESCRIPTION);
        await page.locator('#mentor-offer-duration').selectOption('45');
        await page.locator('#mentor-offer-price').fill('10');
        await page.getByRole('button', { name: 'Create session' }).click();

        const publish = page.getByRole('button', { name: 'Publish' });
        await expect(publish).toBeVisible({ timeout: 15_000 });
        await publish.click();
        await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible({
          timeout: 15_000,
        });

        const publicLink = page.getByText(/Public link:/);
        await expect(publicLink).toBeVisible();
        const linkText = (await publicLink.textContent()) ?? '';
        const pathMatch = linkText.match(/\/s\/[a-z0-9-]+\/[a-z0-9-]+/);
        expect(pathMatch?.[0]).toBeTruthy();
        publicOfferPath = pathMatch![0];

        const guest = await browser.newContext({ storageState: emptyStorage });
        const guestPage = await guest.newPage();
        try {
          await guestPage.goto(publicOfferPath);
          await expect(guestPage.getByRole('heading', { name: OFFER_TITLE })).toBeVisible();
          await expect(guestPage.getByTestId('offer-book-cta')).toBeVisible();
        } finally {
          await guest.close();
        }
      });
    });

    test('published offer is absent from homepage and /experts', async ({ page }) => {
      if (!publicOfferPath) {
        test.skip(true, 'Offer was not published in the prior test');
      }
      for (const path of ['/', '/experts']) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Packaged sessions')).toHaveCount(0);
        await expect(page.getByText(OFFER_TITLE)).toHaveCount(0);
      }
    });

    test.describe('mentee locked checkout', () => {
      test.use({ storageState: menteeAuthFile });

      test('hides duration slider, shows $10.00, and books the SKU', async ({ page }) => {
        if (!publicOfferPath) {
          test.skip(true, 'Offer was not published in the prior test');
        }

        const slugMatch = publicOfferPath.match(/\/s\/([^/]+)\/([^/]+)/);
        expect(slugMatch).toBeTruthy();
        const mentorSlug = slugMatch![1];
        const offerSlug = slugMatch![2];

        await page.goto(`/booking?mentor=${mentorSlug}&offer=${offerSlug}`, {
          waitUntil: 'networkidle',
        });

        await expect(page.locator('input[type=range]')).toHaveCount(0);
        await expect(
          page.locator('#booking-checkout-summary').getByText('$10.00').first(),
        ).toBeVisible();
        await expect(page.getByTestId('booking-offer-sku')).toContainText(OFFER_TITLE);

        const scheduledAt = futureDatetimeLocal();
        await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
        await page.getByTestId('booking-goals').fill(E2E_GOALS);
        await page.getByTestId('booking-background').fill(
          'E2E buyer — booking a packaged expert offer at the locked SKU price.',
        );

        const [response] = await Promise.all([
          page.waitForResponse(
            (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
            { timeout: 90_000 },
          ),
          page.getByTestId('booking-submit').click(),
        ]);

        expect(response.ok(), `POST /api/book failed: ${await response.text()}`).toBeTruthy();
        await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });
        await expect(page.getByText(OFFER_TITLE)).toBeVisible();
      });
    });
  });

  test.describe('services tab after flag restore', () => {
    test.use({ storageState: mentorAuthFile });

    test('hides Services tab after expert offers flag restore', async ({ page }) => {
      await page.goto('/dashboard/mentor');
      await expect(page.getByTestId('mentor-dashboard-sidebar')).toBeVisible();
      await expect(page.getByTestId('mentor-tab-offers')).toHaveCount(0);
    });
  });
});
