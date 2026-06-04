import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes IV is standard for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag is standard

// Get the encryption key from environment variable
// Must be 32 bytes for AES-256 (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function requireEncryptionKeyInProduction(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  if (ENCRYPTION_KEY?.trim()) {
    return;
  }
  throw new Error(
    'ENCRYPTION_KEY is required in production. Generate one with: openssl rand -hex 32',
  );
}

if (!ENCRYPTION_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: ENCRYPTION_KEY environment variable is not set. Using a temporary key for development.',
  );
}

// Ensure we have a 32-byte key
const getSecretKey = (): Buffer => {
  requireEncryptionKeyInProduction();
  if (ENCRYPTION_KEY) {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  }
  return crypto.createHash('sha256').update('dev-fallback-secret-key-astrolink').digest();
};

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Outputs format: ivHex:authTagHex:encryptedHex
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string of format ivHex:authTagHex:encryptedHex using AES-256-GCM.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected iv:authTag:ciphertext');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = getSecretKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
