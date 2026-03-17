import { api } from '../api-client.js';

export interface DashboardSummary {
  agentCount: number;
  activeRuns: number;
  issueStats: Record<string, number>;
  monthlyCost: number;
}

export const dashboardApi = {
  getSummary: (cid: string) => api.get<DashboardSummary>(`/companies/${cid}/dashboard`),
};
