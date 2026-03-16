import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const RedisConfigSchema = z.object({
  url: z.string().min(1),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export const redisConfig = registerAs('redis', (): RedisConfig => {
  return RedisConfigSchema.parse({
    url: process.env['REDIS_URL'],
  });
});
