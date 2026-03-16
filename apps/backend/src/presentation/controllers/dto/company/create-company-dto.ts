import { z } from 'zod';

export const CreateCompanyDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  issuePrefix: z.string().min(1).max(10).transform((v) => v.toUpperCase()),
});

export type CreateCompanyDtoType = z.infer<typeof CreateCompanyDto>;
