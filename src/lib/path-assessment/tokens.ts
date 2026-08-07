import { randomBytes } from 'node:crypto';

/** Unguessable public token for assessment results (~32+ bytes hex). */
export function generatePathAssessmentPublicToken(): string {
  return randomBytes(32).toString('hex');
}

export function isValidPathAssessmentToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token.trim());
}
