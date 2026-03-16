import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IActivityRepository } from '../../../domain/repositories/i-activity-repository.js';
import { ACTIVITY_REPOSITORY } from '../../../domain/repositories/i-activity-repository.js';
import type { IActivityEntry } from '@aicompany/shared';

export class ListActivityQuery {
  constructor(
    public readonly companyId: string,
    public readonly entityType?: string,
    public readonly entityId?: string,
    public readonly limit?: number,
  ) {}
}

@QueryHandler(ListActivityQuery)
export class ListActivityHandler implements IQueryHandler<ListActivityQuery, IActivityEntry[]> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activityRepo: IActivityRepository,
  ) {}

  execute(query: ListActivityQuery): Promise<IActivityEntry[]> {
    if (query.entityType && query.entityId) {
      return this.activityRepo.findAllByEntity(
        query.companyId,
        query.entityType,
        query.entityId,
        query.limit,
      );
    }
    return this.activityRepo.findAllByCompany(query.companyId, query.limit);
  }
}
