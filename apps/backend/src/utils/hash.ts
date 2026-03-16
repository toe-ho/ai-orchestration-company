import { createHash } from 'crypto';

/** SHA-256 hex digest — used for agent API key storage (raw key shown once, hash stored) */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}
