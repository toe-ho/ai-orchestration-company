import { api } from '../api-client.js';
import type { RunStatus } from '@aicompany/shared';

export interface HeartbeatRun {
  id: string;
  companyId: string;
  agentId: string;
  status: RunStatus;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface RunEvent {
  id: string;
  runId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const heartbeatRunsApi = {
  list: (cid: string, params: { agentId?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.agentId) qs.set('agentId', params.agentId);
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return api.get<HeartbeatRun[]>(`/companies/${cid}/runs${query ? `?${query}` : ''}`);
  },

  get: (cid: string, rid: string) => api.get<HeartbeatRun>(`/companies/${cid}/runs/${rid}`),

  listEvents: (cid: string, rid: string) =>
    api.get<RunEvent[]>(`/companies/${cid}/runs/${rid}/events`),

  cancel: (cid: string, rid: string) => api.delete<void>(`/companies/${cid}/runs/${rid}`),
};
