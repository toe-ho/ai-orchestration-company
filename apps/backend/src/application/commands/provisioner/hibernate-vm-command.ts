import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IProvisionerService } from '../../services/interface/i-provisioner-service.js';
import { PROVISIONER_SERVICE } from '../../services/interface/i-provisioner-service.js';

export class HibernateVmCommand {
  constructor(public readonly companyId: string) {}
}

@CommandHandler(HibernateVmCommand)
export class HibernateVmHandler implements ICommandHandler<HibernateVmCommand, void> {
  constructor(
    @Inject(PROVISIONER_SERVICE) private readonly provisioner: IProvisionerService,
  ) {}

  execute(cmd: HibernateVmCommand): Promise<void> {
    return this.provisioner.hibernateVm(cmd.companyId);
  }
}
