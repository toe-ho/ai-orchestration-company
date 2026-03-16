import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IProjectRepository } from '../../../domain/repositories/i-project-repository.js';
import { PROJECT_REPOSITORY } from '../../../domain/repositories/i-project-repository.js';
import type { IProject } from '@aicompany/shared';

export class ListProjectsQuery {
  constructor(public readonly companyId: string) {}
}

@QueryHandler(ListProjectsQuery)
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, IProject[]> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
  ) {}

  execute(query: ListProjectsQuery): Promise<IProject[]> {
    return this.projectRepo.findAllByCompany(query.companyId);
  }
}
