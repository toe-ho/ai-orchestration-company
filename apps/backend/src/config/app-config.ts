import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AppConfigSchema = z.object({
  port: z.coerce.number().default(3100),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  maxAgentsPerCompany: z.coerce.number().default(20),
  maxHireDepth: z.coerce.number().default(3),
  controlPlaneUrl: z.string().default('http://localhost:3100'),
  /** Base64-encoded 32-byte key for AES-256-GCM encryption of stored API keys */
  encryptionKey: z.string().min(1),
  /** HTTP endpoint for the local executor (dev mode) */
  localExecutorUrl: z.string().default('http://localhost:3200'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const appConfig = registerAs('app', (): AppConfig => {
  return AppConfigSchema.parse({
    port: process.env['PORT'],
    host: process.env['HOST'],
    nodeEnv: process.env['NODE_ENV'],
    maxAgentsPerCompany: process.env['MAX_AGENTS_PER_COMPANY'],
    maxHireDepth: process.env['MAX_HIRE_DEPTH'],
    controlPlaneUrl: process.env['CONTROL_PLANE_URL'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    localExecutorUrl: process.env['LOCAL_EXECUTOR_URL'],
  });
});
