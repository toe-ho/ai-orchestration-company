import { api } from '../api-client.js';

export interface Goal {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  progress: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const goalsApi = {
  list: (cid: string) => api.get<Goal[]>(`/companies/${cid}/goals`),

  create: (cid: string, data: { title: string; description?: string }) =>
    api.post<Goal>(`/companies/${cid}/goals`, data),

  update: (cid: string, id: string, data: Partial<{ title: string; description: string; progress: number; completed: boolean }>) =>
    api.patch<Goal>(`/companies/${cid}/goals/${id}`, data),
};
