import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  mkdirSync(path.join(process.cwd(), 'e2e/.auth'), { recursive: true });
}
