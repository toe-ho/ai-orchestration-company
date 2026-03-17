import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { ICompanyTemplate } from '@aicompany/shared';
import type { ITemplateRepository } from '../../../domain/repositories/i-template-repository.js';
import { TEMPLATE_REPOSITORY } from '../../../domain/repositories/i-template-repository.js';

export class GetTemplateQuery {
  constructor(public readonly slug: string) {}
}

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery, ICompanyTemplate> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(query: GetTemplateQuery): Promise<ICompanyTemplate> {
    const template = await this.templateRepo.findBySlug(query.slug);
    if (!template) throw new NotFoundException(`Template '${query.slug}' not found`);
    return template;
  }
}
