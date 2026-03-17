import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AllowAnonymous } from '../../../../decorator/allow-anonymous.js';
import { ListTemplatesQuery } from '../../../../application/queries/template/list-templates-query.js';
import { GetTemplateQuery } from '../../../../application/queries/template/get-template-query.js';

/** Public endpoint — no authentication required */
@Controller('templates')
@AllowAnonymous()
export class PublicTemplateController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list() {
    return this.queryBus.execute(new ListTemplatesQuery(true));
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.queryBus.execute(new GetTemplateQuery(slug));
  }
}
