import { test, expect } from '@playwright/test';
import {
  deleteE2eBookingsForMentee,
  E2E_GOALS_PREFIX,
  setE2eDailyRoomStub,
} from './helpers/supabase-cleanup';
import { futureDatetimeLocal } from './helpers/datetime';

const E2E_GOALS_TAG = `${E2E_GOALS_PREFIX}live-captions`;
const E2E_GOALS = `${E2E_GOALS_TAG} live translated captions`;
const CHRIS_MENTOR_ID = 'a0000002-0000-4000-8000-000000000002';
const CAPTION_LINE = 'We should review the LEO relay architecture.';

test.describe('D3 Phase 3 live captions', () => {
  test.beforeEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test.afterEach(async () => {
    await deleteE2eBookingsForMentee(E2E_GOALS_TAG);
  });

  test('translate-segment API returns stubbed localized line for pt-BR mentee', async ({ page }) => {
    await page.goto('/booking?mentor=chris-sembroski', { waitUntil: 'networkidle' });

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(E2E_GOALS);
    await page.getByTestId('booking-background').fill('E2E live captions buyer.');

    const [bookResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(bookResponse.ok()).toBeTruthy();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });

    const bookedMatch = page.url().match(/booked=([0-9a-f-]{36})/i);
    const bookingId = bookedMatch?.[1];
    expect(bookingId).toBeTruthy();

    const translateResponse = await page.request.post(
      `/api/session/${bookingId}/translate-segment`,
      {
        data: {
          segmentId: 'e2e-seg-1',
          text: CAPTION_LINE,
          sourceLocale: 'en',
        },
      },
    );

    expect(translateResponse.ok(), await translateResponse.text()).toBeTruthy();
    const body = (await translateResponse.json()) as {
      translatedText?: string;
      targetLocale?: string;
      latencyMs?: number;
    };

    expect(body.targetLocale).toBe('pt-BR');
    expect(body.translatedText).toContain('[pt-BR]');
    expect(body.translatedText).toContain('LEO relay architecture');
    expect(typeof body.latencyMs).toBe('number');
  });

  test('caption rail shows stubbed translation after E2E transcription inject', async ({
    page,
  }) => {
    await page.goto('/booking?mentor=chris-sembroski', { waitUntil: 'networkidle' });

    const scheduledAt = futureDatetimeLocal();
    await page.getByTestId('booking-scheduled-at').fill(scheduledAt);
    await page.getByTestId('booking-goals').fill(`${E2E_GOALS} rail`);
    await page.getByTestId('booking-background').fill('E2E caption rail buyer.');

    const [bookResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/book') && res.request().method() === 'POST',
        { timeout: 90_000 },
      ),
      page.getByTestId('booking-submit').click(),
    ]);

    expect(bookResponse.ok()).toBeTruthy();
    await page.waitForURL(/\/dashboard\/mentee/, { timeout: 90_000 });

    const bookedMatch = page.url().match(/booked=([0-9a-f-]{36})/i);
    const bookingId = bookedMatch?.[1];
    expect(bookingId).toBeTruthy();

    await setE2eDailyRoomStub(bookingId!);
    await page.goto(`/session/${bookingId}`);

    await expect(page.getByTestId('session-join-ready')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('session-daily-call')).toBeVisible();
    await expect(page.getByTestId('caption-rail')).toBeVisible();
    await expect(page.getByTestId('session-captions-indicator')).toContainText('pt-BR');

    await page.waitForFunction(() => {
      const w = window as Window & {
        __ASTROLINK_E2E_CAPTIONS__?: { pushTranscriptionEvent: (payload: unknown) => void };
      };
      return Boolean(w.__ASTROLINK_E2E_CAPTIONS__);
    });

    await page.evaluate(
      ({ mentorId, text }) => {
        const w = window as Window & {
          __ASTROLINK_E2E_CAPTIONS__?: { pushTranscriptionEvent: (payload: unknown) => void };
        };
        w.__ASTROLINK_E2E_CAPTIONS__?.pushTranscriptionEvent({
          text,
          user_id: mentorId,
          is_final: true,
          speech_id: 'e2e-rail-1',
          start_ts: 1,
          end_ts: 2,
        });
      },
      { mentorId: CHRIS_MENTOR_ID, text: CAPTION_LINE },
    );

    const captionLine = page.getByTestId('caption-rail-line-0');
    await expect(captionLine).toContainText('[pt-BR]', { timeout: 15_000 });
    await expect(captionLine).toContainText('LEO relay architecture');
  });
});
