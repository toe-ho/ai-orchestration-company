import { z } from 'zod';

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1),
  title: z.string().max(100).optional(),
  icon: z.string().optional(),
  reportsTo: z.string().uuid().optional().nullable(),
  adapterType: z.string().min(1),
  adapterConfig: z.record(z.unknown()).default({}),
  runtimeConfig: z.record(z.unknown()).default({}),
  budgetMonthlyCents: z.number().int().min(0).default(0),
  permissions: z.record(z.unknown()).default({}),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().max(100).optional().nullable(),
  icon: z.string().optional().nullable(),
  adapterConfig: z.record(z.unknown()).optional(),
  runtimeConfig: z.record(z.unknown()).optional(),
  budgetMonthlyCents: z.number().int().min(0).optional(),
  permissions: z.record(z.unknown()).optional(),
});

export type CreateAgentDto = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentDto = z.infer<typeof UpdateAgentSchema>;
