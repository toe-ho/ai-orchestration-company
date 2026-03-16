import { z } from 'zod';

export const CreateProjectDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  goalId: z.string().uuid().optional(),
});

export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;
