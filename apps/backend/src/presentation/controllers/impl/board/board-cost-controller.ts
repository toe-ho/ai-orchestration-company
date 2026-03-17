import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { GetCostSummaryQuery } from '../../../../application/queries/cost/get-cost-summary-query.js';

@Controller('companies/:cid/costs')
@UseGuards(CompanyAccessGuard)
export class BoardCostController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('summary')
  getSummary(
    @Param('cid') cid: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;
    return this.queryBus.execute(new GetCostSummaryQuery(cid, fromDate, toDate));
  }
}
