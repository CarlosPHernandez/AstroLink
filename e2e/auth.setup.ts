import { test as setup } from '@playwright/test';
import {
  bootstrapAdminAuth,
  bootstrapMenteeAuth,
  bootstrapMentorAuth,
} from './helpers/session-bootstrap';

setup('authenticate as mentee (Carlos)', async () => {
  await bootstrapMenteeAuth();
});

setup('authenticate as mentor (Chris)', async () => {
  await bootstrapMentorAuth();
});

setup('authenticate as admin (Flight Command)', async () => {
  await bootstrapAdminAuth();
});
