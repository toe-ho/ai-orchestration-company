import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IProvisionerService } from '../../services/interface/i-provisioner-service.js';
import { PROVISIONER_SERVICE } from '../../services/interface/i-provisioner-service.js';

export class DestroyVmCommand {
  constructor(public readonly companyId: string) {}
}

@CommandHandler(DestroyVmCommand)
export class DestroyVmHandler implements ICommandHandler<DestroyVmCommand, void> {
  constructor(
    @Inject(PROVISIONER_SERVICE) private readonly provisioner: IProvisionerService,
  ) {}

  execute(cmd: DestroyVmCommand): Promise<void> {
    return this.provisioner.destroyVm(cmd.companyId);
  }
}
