import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../../../domain/repositories/i-project-repository.js';
import { PROJECT_REPOSITORY } from '../../../domain/repositories/i-project-repository.js';
import type { IProject } from '@aicompany/shared';

export class GetProjectQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

@QueryHandler(GetProjectQuery)
export class GetProjectHandler implements IQueryHandler<GetProjectQuery, IProject> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(query: GetProjectQuery): Promise<IProject> {
    const project = await this.projectRepo.findByIdAndCompany(query.id, query.companyId);
    if (!project) throw new NotFoundException(`Project ${query.id} not found`);
    return project;
  }
}
