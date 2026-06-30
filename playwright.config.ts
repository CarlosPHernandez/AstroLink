import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const authDir = path.join(__dirname, 'e2e/.auth');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'mentee.json'),
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_MODE: 'full',
      ENABLE_DEMO_AUTH: 'true',
      SKIP_STRIPE_PAYMENTS: 'true',
      E2E_STUB_LLM: 'true',
      DAILY_API_KEY: '',
      DAILY_PROVISION_ENABLED: 'false',
      DAILY_TRANSCRIPTION_ENABLED: 'false',
      NOTIFICATIONS_DISABLED: 'true',
      CHRIS_BOOKING_ENABLED: 'true',
    },
  },
});
