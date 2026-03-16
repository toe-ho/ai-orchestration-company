import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AuthConfigSchema = z.object({
  secret: z.string().min(16),
  url: z.string().url(),
  agentJwtSecret: z.string().min(16),
  agentJwtTtlSeconds: z.coerce.number().default(172800),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export const authConfig = registerAs('auth', (): AuthConfig => {
  return AuthConfigSchema.parse({
    secret: process.env['AUTH_SECRET'],
    url: process.env['AUTH_URL'],
    agentJwtSecret: process.env['AGENT_JWT_SECRET'],
    agentJwtTtlSeconds: process.env['AGENT_JWT_TTL_SECONDS'],
  });
});
