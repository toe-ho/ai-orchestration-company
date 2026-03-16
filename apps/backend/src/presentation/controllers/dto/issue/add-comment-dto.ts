import { z } from 'zod';

export const AddCommentDto = z.object({
  content: z.string().min(1),
});

export type AddCommentDtoType = z.infer<typeof AddCommentDto>;
