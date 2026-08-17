import { expect, type Page } from '@playwright/test';

/** Mentee session room asks for caption language before Daily mounts. */
export async function confirmCaptionLanguage(page: Page) {
  const continueBtn = page.getByTestId('caption-language-continue');
  const dailyCall = page.getByTestId('session-daily-call');
  await expect(continueBtn.or(dailyCall)).toBeVisible({ timeout: 15_000 });
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  }
}
