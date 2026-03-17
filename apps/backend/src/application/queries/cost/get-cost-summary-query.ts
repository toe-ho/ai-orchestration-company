import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICostEventRepository, CostSummary } from '../../../domain/repositories/i-cost-event-repository.js';
import { COST_EVENT_REPOSITORY } from '../../../domain/repositories/i-cost-event-repository.js';

export class GetCostSummaryQuery {
  constructor(
    public readonly companyId: string,
    public readonly from: Date,
    public readonly to: Date,
  ) {}
}

@QueryHandler(GetCostSummaryQuery)
export class GetCostSummaryHandler implements IQueryHandler<GetCostSummaryQuery, CostSummary> {
  constructor(
    @Inject(COST_EVENT_REPOSITORY) private readonly repo: ICostEventRepository,
  ) {}

  execute(query: GetCostSummaryQuery): Promise<CostSummary> {
    return this.repo.getSummary(query.companyId, query.from, query.to);
  }
}
