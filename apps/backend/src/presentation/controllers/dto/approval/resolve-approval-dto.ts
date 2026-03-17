import { z } from 'zod';

export const ResolveApprovalDto = z.object({
  resolvedByUserId: z.string().min(1),
});

export type ResolveApprovalDtoType = z.infer<typeof ResolveApprovalDto>;
