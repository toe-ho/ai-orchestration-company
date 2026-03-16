import { z } from 'zod';

export const CreateGoalDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateGoalDtoType = z.infer<typeof CreateGoalDto>;
