import type { ICompanyTemplate } from '@aicompany/shared';

export interface ITemplateRepository {
  findAll(): Promise<ICompanyTemplate[]>;
  findPublic(): Promise<ICompanyTemplate[]>;
  findById(id: string): Promise<ICompanyTemplate | null>;
  findBySlug(slug: string): Promise<ICompanyTemplate | null>;
  create(data: Partial<ICompanyTemplate>): Promise<ICompanyTemplate>;
}

export const TEMPLATE_REPOSITORY = Symbol('ITemplateRepository');
