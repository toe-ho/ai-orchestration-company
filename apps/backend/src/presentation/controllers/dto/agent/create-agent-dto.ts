import { z } from 'zod';

export const CreateAgentDto = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  title: z.string().optional(),
  reportsTo: z.string().uuid().optional(),
  adapterType: z.string().min(1),
  adapterConfig: z.record(z.unknown()).optional(),
  runtimeConfig: z.record(z.unknown()).optional(),
  budgetMonthlyCents: z.number().int().min(0).optional(),
  permissions: z.record(z.unknown()).optional(),
});

export type CreateAgentDtoType = z.infer<typeof CreateAgentDto>;
