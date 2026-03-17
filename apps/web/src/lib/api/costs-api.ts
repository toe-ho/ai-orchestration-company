import { api } from '../api-client.js';

export interface CostSummary {
  totalCents: number;
  byAgent: Array<{ agentId: string; totalCents: number }>;
  byProvider: Array<{ provider: string; totalCents: number }>;
  byDay: Array<{ date: string; totalCents: number }>;
}

export const costsApi = {
  getSummary: (cid: string, from?: string, to?: string): Promise<CostSummary> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<CostSummary>(`/companies/${cid}/costs/summary${qs}`);
  },
};
