import { api } from '../api-client.js';
import type { IssueStatus, IssuePriority } from '@aicompany/shared';

export interface Issue {
  id: string;
  identifier: string;
  companyId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface IssueListParams {
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeAgentId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export const issuesApi = {
  list: (cid: string, params: IssueListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    const query = qs.toString();
    return api.get<Issue[]>(`/companies/${cid}/issues${query ? `?${query}` : ''}`);
  },

  search: (cid: string, q: string, limit?: number) =>
    api.get<Issue[]>(`/companies/${cid}/issues/search?q=${encodeURIComponent(q)}${limit ? `&limit=${limit}` : ''}`),

  get: (cid: string, id: string) => api.get<Issue>(`/companies/${cid}/issues/${id}`),

  listComments: (cid: string, id: string) =>
    api.get<IssueComment[]>(`/companies/${cid}/issues/${id}/comments`),

  create: (cid: string, data: { title: string; description?: string; priority?: IssuePriority }) =>
    api.post<Issue>(`/companies/${cid}/issues`, data),

  update: (cid: string, id: string, data: Partial<{ title: string; description: string; status: IssueStatus; priority: IssuePriority }>) =>
    api.patch<Issue>(`/companies/${cid}/issues/${id}`, data),
};
