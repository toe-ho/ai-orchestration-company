import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IApprovalRepository } from '../../../domain/repositories/i-approval-repository.js';
import { APPROVAL_REPOSITORY } from '../../../domain/repositories/i-approval-repository.js';
import type { ApprovalModel } from '../../../infrastructure/persistence/models/approval-model.js';

export class ListApprovalsQuery {
  constructor(
    public readonly companyId: string,
    public readonly status?: string,
  ) {}
}

@QueryHandler(ListApprovalsQuery)
export class ListApprovalsHandler implements IQueryHandler<ListApprovalsQuery, ApprovalModel[]> {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repo: IApprovalRepository,
  ) {}

  execute(query: ListApprovalsQuery): Promise<ApprovalModel[]> {
    return this.repo.findByCompany(query.companyId, query.status);
  }
}
