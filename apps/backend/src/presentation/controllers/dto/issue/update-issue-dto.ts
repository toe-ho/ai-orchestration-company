import { z } from 'zod';

export const UpdateIssueDto = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']).optional(),
  assigneeAgentId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
});

export type UpdateIssueDtoType = z.infer<typeof UpdateIssueDto>;
