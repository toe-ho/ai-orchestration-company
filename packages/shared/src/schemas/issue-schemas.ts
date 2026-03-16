import { z } from 'zod';

export const CreateIssueSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']).default('backlog'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  projectId: z.string().uuid().optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  assigneeAgentId: z.string().uuid().optional().nullable(),
});

export const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  assigneeAgentId: z.string().uuid().optional().nullable(),
});

export const CheckoutIssueSchema = z.object({
  agentId: z.string().uuid(),
  expectedStatuses: z.array(z.string()).default(['todo', 'backlog']),
});

export type CreateIssueDto = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueDto = z.infer<typeof UpdateIssueSchema>;
export type CheckoutIssueDto = z.infer<typeof CheckoutIssueSchema>;
