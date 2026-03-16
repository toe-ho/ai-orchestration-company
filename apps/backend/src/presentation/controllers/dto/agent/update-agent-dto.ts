import { z } from 'zod';

export const UpdateAgentDto = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  title: z.string().optional(),
  reportsTo: z.string().uuid().nullable().optional(),
  adapterType: z.string().optional(),
  adapterConfig: z.record(z.unknown()).optional(),
  runtimeConfig: z.record(z.unknown()).optional(),
  budgetMonthlyCents: z.number().int().min(0).optional(),
  permissions: z.record(z.unknown()).optional(),
});

export type UpdateAgentDtoType = z.infer<typeof UpdateAgentDto>;
