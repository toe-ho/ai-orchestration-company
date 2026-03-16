/** List of environment variables that must NEVER be injected into agent processes */
const BLOCKED_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'DATABASE_URL',
  'AUTH_SECRET',
  'ENCRYPTION_KEY',
  'FLY_API_TOKEN',
  'REDIS_URL',
];

/**
 * Strips dangerous or sensitive environment variables before passing
 * an env map to a child process or Fly.io VM.
 */
export function cleanEnv(rawEnv: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawEnv)) {
    if (!BLOCKED_ENV_VARS.includes(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
