import { z } from 'zod';

export const UpdateCompanyDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  brandColor: z.string().optional(),
});

export type UpdateCompanyDtoType = z.infer<typeof UpdateCompanyDto>;
