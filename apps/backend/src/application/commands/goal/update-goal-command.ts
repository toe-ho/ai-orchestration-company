import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IGoalRepository } from '../../../domain/repositories/i-goal-repository.js';
import { GOAL_REPOSITORY } from '../../../domain/repositories/i-goal-repository.js';
import type { IGoal } from '@aicompany/shared';

export class UpdateGoalCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly partial: Partial<IGoal>,
  ) {}
}

@CommandHandler(UpdateGoalCommand)
export class UpdateGoalHandler implements ICommandHandler<UpdateGoalCommand, IGoal> {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
  ) {}

  async execute(cmd: UpdateGoalCommand): Promise<IGoal> {
    const updated = await this.goalRepo.update(cmd.id, cmd.partial);
    if (!updated) throw new NotFoundException(`Goal ${cmd.id} not found`);
    return updated;
  }
}
