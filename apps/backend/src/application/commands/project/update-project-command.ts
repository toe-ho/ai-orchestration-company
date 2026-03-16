import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../../../domain/repositories/i-project-repository.js';
import { PROJECT_REPOSITORY } from '../../../domain/repositories/i-project-repository.js';
import type { IProject } from '@aicompany/shared';

export class UpdateProjectCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly partial: Partial<IProject>,
  ) {}
}

@CommandHandler(UpdateProjectCommand)
export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand, IProject> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(cmd: UpdateProjectCommand): Promise<IProject> {
    const updated = await this.projectRepo.update(cmd.id, cmd.partial);
    if (!updated) throw new NotFoundException(`Project ${cmd.id} not found`);
    return updated;
  }
}
