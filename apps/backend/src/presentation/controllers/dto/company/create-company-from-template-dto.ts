import { z } from 'zod';

export const CreateCompanyFromTemplateDto = z.object({
  templateSlug: z.string().min(1),
  companyName: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
});

export type CreateCompanyFromTemplateDtoType = z.infer<typeof CreateCompanyFromTemplateDto>;
