import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const FlyioConfigSchema = z.object({
  apiToken: z.string().min(1),
  appName: z.string().min(1),
  region: z.string().default('sjc'),
  vmSize: z.string().default('shared-cpu-2x'),
  idleTimeoutMin: z.coerce.number().default(10),
});

export type FlyioConfig = z.infer<typeof FlyioConfigSchema>;

export const flyioConfig = registerAs('flyio', (): FlyioConfig => {
  return FlyioConfigSchema.parse({
    apiToken: process.env['FLY_API_TOKEN'],
    appName: process.env['FLY_APP_NAME'],
    region: process.env['FLY_REGION'],
    vmSize: process.env['FLY_VM_SIZE'],
    idleTimeoutMin: process.env['FLY_IDLE_TIMEOUT_MIN'],
  });
});
