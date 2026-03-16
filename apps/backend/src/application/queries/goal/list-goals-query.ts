import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IGoalRepository } from '../../../domain/repositories/i-goal-repository.js';
import { GOAL_REPOSITORY } from '../../../domain/repositories/i-goal-repository.js';
import type { IGoal } from '@aicompany/shared';

export class ListGoalsQuery {
  constructor(public readonly companyId: string) {}
}

@QueryHandler(ListGoalsQuery)
export class ListGoalsHandler implements IQueryHandler<ListGoalsQuery, IGoal[]> {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
  ) {}

  execute(query: ListGoalsQuery): Promise<IGoal[]> {
    return this.goalRepo.findAllByCompany(query.companyId);
  }
}
