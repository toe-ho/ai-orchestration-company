import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IApprovalRepository } from '../../../domain/repositories/i-approval-repository.js';
import { APPROVAL_REPOSITORY } from '../../../domain/repositories/i-approval-repository.js';
import type { ApprovalModel } from '../../../infrastructure/persistence/models/approval-model.js';

export class GetApprovalQuery {
  constructor(
    public readonly companyId: string,
    public readonly approvalId: string,
  ) {}
}

@QueryHandler(GetApprovalQuery)
export class GetApprovalHandler implements IQueryHandler<GetApprovalQuery, ApprovalModel> {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repo: IApprovalRepository,
  ) {}

  async execute(query: GetApprovalQuery): Promise<ApprovalModel> {
    const approval = await this.repo.findById(query.approvalId);
    if (!approval || approval.companyId !== query.companyId) {
      throw new NotFoundException(`Approval ${query.approvalId} not found`);
    }
    return approval;
  }
}
