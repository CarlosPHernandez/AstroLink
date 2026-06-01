import { test as setup } from '@playwright/test';
import { bootstrapMenteeAuth, bootstrapMentorAuth } from './helpers/session-bootstrap';

setup('authenticate as mentee (Carlos)', async () => {
  await bootstrapMenteeAuth();
});

setup('authenticate as mentor (Chris)', async () => {
  await bootstrapMentorAuth();
});
