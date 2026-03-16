import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AuthConfigSchema = z.object({
  secret: z.string().min(16),
  url: z.string().url(),
  agentJwtSecret: z.string().min(16),
  agentJwtTtlSeconds: z.coerce.number().default(172800),
  // Optional OAuth providers
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  githubClientId: z.string().optional(),
  githubClientSecret: z.string().optional(),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export const authConfig = registerAs('auth', (): AuthConfig => {
  return AuthConfigSchema.parse({
    secret: process.env['AUTH_SECRET'],
    url: process.env['AUTH_URL'],
    agentJwtSecret: process.env['AGENT_JWT_SECRET'],
    agentJwtTtlSeconds: process.env['AGENT_JWT_TTL_SECONDS'],
    googleClientId: process.env['GOOGLE_CLIENT_ID'],
    googleClientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    githubClientId: process.env['GITHUB_CLIENT_ID'],
    githubClientSecret: process.env['GITHUB_CLIENT_SECRET'],
  });
});
