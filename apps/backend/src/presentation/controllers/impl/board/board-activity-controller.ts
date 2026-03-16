import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { ListActivityQuery } from '../../../../application/queries/activity/list-activity-query.js';

@Controller('companies/:cid/activity')
@UseGuards(CompanyAccessGuard)
export class BoardActivityController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  list(
    @Param('cid') cid: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(
      new ListActivityQuery(cid, entityType, entityId, limit ? parseInt(limit, 10) : undefined),
    );
  }
}
