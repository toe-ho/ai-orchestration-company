import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Encrypts a plaintext string with AES-256-GCM. Returns base64-encoded iv:tag:ciphertext */
export function encrypt(plaintext: string, secretKey: string): string {
  const key = Buffer.from(secretKey, 'base64');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypts a base64-encoded iv:tag:ciphertext string produced by encrypt() */
export function decrypt(ciphertext: string, secretKey: string): string {
  const key = Buffer.from(secretKey, 'base64');
  const [ivB64, tagB64, dataB64] = ciphertext.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}
