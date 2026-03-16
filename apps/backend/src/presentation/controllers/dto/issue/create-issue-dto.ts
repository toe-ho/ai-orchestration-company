import { z } from 'zod';

export const CreateIssueDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']).optional(),
  projectId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  assigneeAgentId: z.string().uuid().optional(),
});

export type CreateIssueDtoType = z.infer<typeof CreateIssueDto>;
