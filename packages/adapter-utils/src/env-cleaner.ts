/** Only these env vars are forwarded to child agent processes */
const ALLOWED_ENV_VARS = ['ANTHROPIC_API_KEY', 'NODE_ENV', 'HOME', 'PATH', 'TMPDIR'];

/**
 * Allowlist-based env cleaner — returns only the vars explicitly permitted.
 * Everything else is stripped, preventing secrets from leaking into agent processes.
 */
export function cleanEnv(rawEnv: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const key of ALLOWED_ENV_VARS) {
    if (Object.prototype.hasOwnProperty.call(rawEnv, key) && rawEnv[key] !== undefined) {
      cleaned[key] = rawEnv[key];
    }
  }
  return cleaned;
}
