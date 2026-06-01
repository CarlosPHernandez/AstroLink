import type { Page } from '@playwright/test';

/** UI preset flow — may fail if server-action redirect is flaky; prefer session-bootstrap for setup. */
export async function loginWithPreset(
  page: Page,
  testId: 'auth-preset-mentee' | 'auth-preset-mentor',
  dashboardSegment: 'mentee' | 'mentor',
) {
  await page.goto('/auth');
  await page.locator('#email').fill(
    testId === 'auth-preset-mentee' ? 'carlos@astrolink.ai' : 'chris@astrolink.ai',
  );
  await page.locator('#password').fill('password123');
  await Promise.all([
    page.waitForURL(`**/dashboard/${dashboardSegment}**`, { timeout: 60_000 }),
    page.getByRole('button', { name: /Sign In/i }).click(),
  ]);
}
