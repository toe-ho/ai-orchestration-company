import { api } from '../api-client.js';

export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const companiesApi = {
  list: () => api.get<Company[]>('/companies'),

  get: (cid: string) => api.get<Company>(`/companies/${cid}`),

  create: (data: { name: string; description?: string }) =>
    api.post<Company>('/companies', data),

  update: (cid: string, data: { name?: string; description?: string }) =>
    api.patch<Company>(`/companies/${cid}`, data),

  delete: (cid: string) => api.delete<void>(`/companies/${cid}`),
};
