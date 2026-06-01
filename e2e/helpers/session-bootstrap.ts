import { request as playwrightRequest } from '@playwright/test';
import { menteeAuthFile, mentorAuthFile } from '../fixtures/auth';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export async function createStorageState(role: 'mentee' | 'mentor', path: string) {
  const context = await playwrightRequest.newContext({ baseURL });
  const response = await context.post('/api/e2e/session', { data: { role } });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`E2E session bootstrap failed (${response.status()}): ${body}`);
  }
  await context.storageState({ path });
  await context.dispose();
}

export async function bootstrapMenteeAuth() {
  await createStorageState('mentee', menteeAuthFile);
}

export async function bootstrapMentorAuth() {
  await createStorageState('mentor', mentorAuthFile);
}
