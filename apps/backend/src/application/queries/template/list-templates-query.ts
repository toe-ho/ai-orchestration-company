import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICompanyTemplate } from '@aicompany/shared';
import type { ITemplateRepository } from '../../../domain/repositories/i-template-repository.js';
import { TEMPLATE_REPOSITORY } from '../../../domain/repositories/i-template-repository.js';

export class ListTemplatesQuery {
  constructor(public readonly publicOnly: boolean = true) {}
}

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler implements IQueryHandler<ListTemplatesQuery, ICompanyTemplate[]> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: ITemplateRepository,
  ) {}

  execute(query: ListTemplatesQuery): Promise<ICompanyTemplate[]> {
    return query.publicOnly ? this.templateRepo.findPublic() : this.templateRepo.findAll();
  }
}
