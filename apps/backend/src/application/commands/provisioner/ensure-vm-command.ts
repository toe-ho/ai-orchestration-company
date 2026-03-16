import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICompanyVm } from '@aicompany/shared';
import type { IProvisionerService } from '../../services/interface/i-provisioner-service.js';
import { PROVISIONER_SERVICE } from '../../services/interface/i-provisioner-service.js';

export class EnsureVmCommand {
  constructor(public readonly companyId: string) {}
}

@CommandHandler(EnsureVmCommand)
export class EnsureVmHandler implements ICommandHandler<EnsureVmCommand, ICompanyVm> {
  constructor(
    @Inject(PROVISIONER_SERVICE) private readonly provisioner: IProvisionerService,
  ) {}

  execute(cmd: EnsureVmCommand): Promise<ICompanyVm> {
    return this.provisioner.ensureVm(cmd.companyId);
  }
}
