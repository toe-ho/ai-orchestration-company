import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IActivityRepository } from '../../../domain/repositories/i-activity-repository.js';
import { ACTIVITY_REPOSITORY } from '../../../domain/repositories/i-activity-repository.js';
import type { IActivityEntry } from '@aicompany/shared';

export class LogActivityCommand {
  constructor(
    public readonly companyId: string,
    public readonly actorId: string,
    public readonly actorType: string,
    public readonly action: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly details?: Record<string, unknown>,
  ) {}
}

@CommandHandler(LogActivityCommand)
export class LogActivityHandler implements ICommandHandler<LogActivityCommand, IActivityEntry> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activityRepo: IActivityRepository,
  ) {}

  execute(cmd: LogActivityCommand): Promise<IActivityEntry> {
    return this.activityRepo.create({
      companyId: cmd.companyId,
      actorId: cmd.actorId,
      actorType: cmd.actorType,
      action: cmd.action,
      entityType: cmd.entityType,
      entityId: cmd.entityId,
      details: cmd.details ?? null,
    });
  }
}
