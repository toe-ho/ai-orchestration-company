import { api } from '../api-client.js';

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  list: (cid: string) => api.get<Project[]>(`/companies/${cid}/projects`),

  get: (cid: string, id: string) => api.get<Project>(`/companies/${cid}/projects/${id}`),

  create: (cid: string, data: { name: string; description?: string }) =>
    api.post<Project>(`/companies/${cid}/projects`, data),

  update: (cid: string, id: string, data: Partial<{ name: string; description: string }>) =>
    api.patch<Project>(`/companies/${cid}/projects/${id}`, data),
};
