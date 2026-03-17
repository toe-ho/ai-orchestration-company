import { api } from '../api-client.js';

export interface Approval {
  id: string;
  companyId: string;
  type: string;
  status: string;
  title: string;
  description: string;
  details: Record<string, unknown> | null;
  requestedByAgentId: string | null;
  requestedByUserId: string | null;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const approvalsApi = {
  list: (cid: string, status?: string): Promise<Approval[]> => {
    const qs = status ? `?status=${status}` : '';
    return api.get<Approval[]>(`/companies/${cid}/approvals${qs}`);
  },
  get: (cid: string, id: string): Promise<Approval> =>
    api.get<Approval>(`/companies/${cid}/approvals/${id}`),
  create: (
    cid: string,
    body: { type: string; title: string; description: string; details?: Record<string, unknown> },
  ): Promise<Approval> => api.post<Approval>(`/companies/${cid}/approvals`, body),
  approve: (cid: string, id: string, resolvedByUserId: string): Promise<void> =>
    api.post<void>(`/companies/${cid}/approvals/${id}/approve`, { resolvedByUserId }),
  reject: (cid: string, id: string, resolvedByUserId: string): Promise<void> =>
    api.post<void>(`/companies/${cid}/approvals/${id}/reject`, { resolvedByUserId }),
  requestRevision: (cid: string, id: string, resolvedByUserId: string): Promise<void> =>
    api.post<void>(`/companies/${cid}/approvals/${id}/request-revision`, { resolvedByUserId }),
};
