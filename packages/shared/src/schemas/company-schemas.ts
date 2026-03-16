import { z } from 'zod';

export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  issuePrefix: z.string().min(1).max(10).toUpperCase(),
  budgetMonthlyCents: z.number().int().min(0).default(0),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  templateId: z.string().optional(),
});

export const UpdateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  budgetMonthlyCents: z.number().int().min(0).optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>;
