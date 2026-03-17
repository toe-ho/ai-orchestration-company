import { z } from 'zod';

export const CreateApprovalDto = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  details: z.record(z.unknown()).optional(),
});

export type CreateApprovalDtoType = z.infer<typeof CreateApprovalDto>;
