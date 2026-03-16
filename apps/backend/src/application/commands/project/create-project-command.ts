import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IProjectRepository } from '../../../domain/repositories/i-project-repository.js';
import { PROJECT_REPOSITORY } from '../../../domain/repositories/i-project-repository.js';
import type { IProject } from '@aicompany/shared';

export class CreateProjectCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly goalId?: string,
  ) {}
}

@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand, IProject> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
  ) {}

  execute(cmd: CreateProjectCommand): Promise<IProject> {
    return this.projectRepo.create({
      companyId: cmd.companyId,
      name: cmd.name,
      description: cmd.description ?? null,
      goalId: cmd.goalId ?? null,
      status: 'active',
    });
  }
}
