import { api } from '../api-client.js';
import type { AgentStatus, AgentRole } from '@aicompany/shared';

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  lastHeartbeat?: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrgTreeNode {
  agent: Agent;
  children: OrgTreeNode[];
}

export const agentsApi = {
  list: (cid: string, status?: AgentStatus) =>
    api.get<Agent[]>(`/companies/${cid}/agents${status ? `?status=${status}` : ''}`),

  orgTree: (cid: string) => api.get<OrgTreeNode>(`/companies/${cid}/agents/org-tree`),

  get: (cid: string, id: string) => api.get<Agent>(`/companies/${cid}/agents/${id}`),

  create: (cid: string, data: { name: string; role: AgentRole }) =>
    api.post<Agent>(`/companies/${cid}/agents`, data),

  update: (cid: string, id: string, data: Partial<{ name: string; config: Record<string, unknown> }>) =>
    api.patch<Agent>(`/companies/${cid}/agents/${id}`, data),

  pause: (cid: string, id: string) => api.post<Agent>(`/companies/${cid}/agents/${id}/pause`),

  resume: (cid: string, id: string) => api.post<Agent>(`/companies/${cid}/agents/${id}/resume`),

  terminate: (cid: string, id: string) => api.post<Agent>(`/companies/${cid}/agents/${id}/terminate`),
};
