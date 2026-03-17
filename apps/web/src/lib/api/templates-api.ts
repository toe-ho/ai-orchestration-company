import { api } from '../api-client.js';

export interface CompanyTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  agentConfigs: unknown[];
  goalTemplate: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateCompanyFromTemplatePayload {
  templateSlug: string;
  companyName: string;
  description?: string;
  goal?: string;
}

export const templatesApi = {
  /** Public — no auth required */
  listPublic: () => api.get<CompanyTemplate[]>('/templates'),

  /** Public — no auth required */
  getPublic: (slug: string) => api.get<CompanyTemplate>(`/templates/${slug}`),

  /** Authenticated — create company from template (wizard final step) */
  createCompany: (payload: CreateCompanyFromTemplatePayload) =>
    api.post('/companies/from-template', payload),
};
