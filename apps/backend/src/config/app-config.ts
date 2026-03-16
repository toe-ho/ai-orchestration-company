import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AppConfigSchema = z.object({
  port: z.coerce.number().default(3100),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  maxAgentsPerCompany: z.coerce.number().default(20),
  maxHireDepth: z.coerce.number().default(3),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const appConfig = registerAs('app', (): AppConfig => {
  return AppConfigSchema.parse({
    port: process.env['PORT'],
    host: process.env['HOST'],
    nodeEnv: process.env['NODE_ENV'],
    maxAgentsPerCompany: process.env['MAX_AGENTS_PER_COMPANY'],
    maxHireDepth: process.env['MAX_HIRE_DEPTH'],
  });
});
