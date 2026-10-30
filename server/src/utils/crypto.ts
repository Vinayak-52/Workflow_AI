import crypto from 'crypto';
import { ENV } from '../config/env.js';

// AES-256-CBC token encryption helper
const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  // Ensure exactly 32 bytes for AES-256
  const key = ENV.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptToken(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return '';
  const [ivHex, encryptedData] = cipherText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
