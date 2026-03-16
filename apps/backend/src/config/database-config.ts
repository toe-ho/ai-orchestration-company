import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DatabaseConfigSchema = z.object({
  url: z.string().url().startsWith('postgres'),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  return DatabaseConfigSchema.parse({
    url: process.env['DATABASE_URL'],
  });
});
