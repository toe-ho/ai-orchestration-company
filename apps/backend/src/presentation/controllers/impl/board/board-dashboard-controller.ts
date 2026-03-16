import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { GetDashboardSummaryQuery } from '../../../../application/queries/dashboard/get-dashboard-summary-query.js';

@Controller('companies/:cid/dashboard')
@UseGuards(CompanyAccessGuard)
export class BoardDashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  summary(@Param('cid') cid: string) {
    return this.queryBus.execute(new GetDashboardSummaryQuery(cid));
  }
}
