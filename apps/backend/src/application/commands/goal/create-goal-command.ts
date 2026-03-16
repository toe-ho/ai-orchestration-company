import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IGoalRepository } from '../../../domain/repositories/i-goal-repository.js';
import { GOAL_REPOSITORY } from '../../../domain/repositories/i-goal-repository.js';
import type { IGoal } from '@aicompany/shared';

export class CreateGoalCommand {
  constructor(
    public readonly companyId: string,
    public readonly title: string,
    public readonly description?: string,
    public readonly level?: string,
    public readonly parentId?: string,
  ) {}
}

@CommandHandler(CreateGoalCommand)
export class CreateGoalHandler implements ICommandHandler<CreateGoalCommand, IGoal> {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
  ) {}

  execute(cmd: CreateGoalCommand): Promise<IGoal> {
    return this.goalRepo.create({
      companyId: cmd.companyId,
      title: cmd.title,
      description: cmd.description ?? null,
      level: cmd.level ?? 'company',
      parentId: cmd.parentId ?? null,
      status: 'active',
    });
  }
}
