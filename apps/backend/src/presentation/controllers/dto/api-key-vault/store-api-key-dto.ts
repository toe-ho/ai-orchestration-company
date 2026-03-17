import { z } from 'zod';

export const StoreApiKeyDto = z.object({
  provider: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
});

export type StoreApiKeyDtoType = z.infer<typeof StoreApiKeyDto>;
