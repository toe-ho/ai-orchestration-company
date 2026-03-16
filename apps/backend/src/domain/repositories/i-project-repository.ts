import type { IProject } from '@aicompany/shared';

export interface IProjectRepository {
  findById(id: string): Promise<IProject | null>;
  findByIdAndCompany(id: string, companyId: string): Promise<IProject | null>;
  findAllByCompany(companyId: string): Promise<IProject[]>;
  create(data: Partial<IProject>): Promise<IProject>;
  update(id: string, partial: Partial<IProject>): Promise<IProject | null>;
}

export const PROJECT_REPOSITORY = Symbol('IProjectRepository');
